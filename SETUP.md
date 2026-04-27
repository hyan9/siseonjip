# 카든냥 셋업 가이드

처음 한 번만 따라 하면 됩니다. 5–10분.

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 가입 → **New project**
2. 이름: `siseonjip` (아무거나) / Region: `Northeast Asia (Seoul)` 권장
3. **DB password**는 따로 적어두세요 (분실 시 재설정 가능)
4. 프로젝트 생성까지 1–2분 대기

## 2. 환경 변수 입력

프로젝트 대시보드 → 좌측 **Project Settings (톱니바퀴) → API**

복사할 두 값:
- **Project URL** (`https://xxxxx.supabase.co`)
- **anon public key** (긴 문자열)

`.env.local` 파일을 열어서 채웁니다:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIU...
```

## 3. DB 스키마 적용

Supabase 대시보드 → 좌측 **SQL Editor → New query**

`supabase/schema.sql` 내용을 통째로 복사해서 붙여넣고 **Run**.

성공하면 좌측 **Table Editor**에서 6개 테이블이 보여야 합니다:
`profiles, places, artworks, comments, hypes, curate_slots`

## 4. 사진 저장용 버킷 만들기

좌측 **Storage → New bucket**

- 이름: `photos` (정확히 이 이름이어야 함 — 코드에서 참조)
- **Public bucket** 체크 ✅ (사진은 누구나 볼 수 있어야 함)
- Create

> 버킷을 만든 뒤, schema.sql 마지막 부분의 storage 정책이 적용되어 있어야 업로드 권한이 잡힙니다. 만약 SQL 실행 시 'storage.objects' 관련 에러가 났다면, 버킷 만든 뒤 schema.sql 마지막 storage 블록만 다시 실행하세요.

## 5. 인증 방법 설정

좌측 **Authentication → Providers**

세 가지 로그인 방법 중 원하는 것 활성화 (다 켜두면 사용자가 골라 씀):

### 5-1. Email (Magic Link) — 기본 활성화
별도 설정 없음.

### 5-2. Anonymous Sign-In (가장 편한 방법)
**Authentication → Sign In / Providers** 에서 **Anonymous Sign-Ins** 토글 ON.
이메일 없이 "둘러보기" 버튼으로 즉시 입장 가능. 단, 브라우저 데이터 지우면 계정 사라짐.

### 5-3. Google OAuth (1탭 로그인, 셋업 10분)
1. https://console.cloud.google.com → 새 프로젝트
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** 선택
3. Application type: **Web application**
4. Authorized redirect URIs에 추가 (Supabase Project Settings → API → "Project URL" 참고):
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
5. 생성된 **Client ID + Client Secret** 복사
6. Supabase로 돌아와 **Authentication → Providers → Google → Enable** 후 두 값 붙여넣고 Save

### URL Configuration
- **Site URL**: 배포 후엔 Vercel URL로. 개발만 할 거면 `http://localhost:5173`
- **Redirect URLs**: `http://localhost:5173/**`, `https://<vercel-url>/**` 둘 다 등록 (와일드카드 `**` 필수)

## 6. 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 → 이메일 입력 → 메일함의 매직 링크 클릭 → 로그인 완료.

## 7. 배포 (Vercel)

1. https://vercel.com 가입 (GitHub 연동)
2. 이 폴더를 GitHub repo에 push
3. Vercel에서 **Import Project** → 자동 감지됨
4. **Environment Variables**에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 두 개 추가
5. Deploy → 끝. URL 받아서 친구한테 공유.

배포 후 Supabase Authentication → URL Configuration → **Site URL과 Redirect URLs**에 Vercel 도메인 추가하는 것 잊지 말기 (안 그러면 매직 링크가 localhost로 보내짐).

---

## 트러블슈팅

- **로그인 메일 안 옴**: Supabase 무료 티어는 시간당 메일 제한이 있어요. 스팸함도 확인.
- **사진 업로드 실패 (403)**: storage 정책이 안 깔린 경우. schema.sql의 마지막 storage 블록 다시 실행.
- **위치 안 잡힘**: 대부분의 사진에는 EXIF GPS가 없어요 (스크린샷, 카톡 다운로드 등). 카메라로 직접 찍은 원본 사진을 시도해보세요. 그래도 없으면 위치는 수동 입력 가능.
