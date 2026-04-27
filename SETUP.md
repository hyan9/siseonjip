# 시선집 셋업 가이드

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

- **Email** 활성화 (기본값) — Magic Link 방식 사용
- (선택) **Site URL**: `http://localhost:5173` (개발용). 배포 후 Vercel URL로 변경.

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
