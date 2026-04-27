# 카든냥 (Siseonjip)

사진 한 장이 오늘의 전시가 되는 곳. 위치 기반으로 동네별 전시가 자동으로 생기는 사진 우선형 SNS.

## 스택

- **Frontend**: Vite + React + Tailwind v4
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Maps**: Leaflet + OpenStreetMap (API 키 불필요)
- **역지오코딩**: Nominatim (무료)
- **EXIF GPS**: exifr

## 시작하기

처음이면 [SETUP.md](./SETUP.md) 가이드를 먼저 따라 하세요 (5–10분).

이미 셋업했다면:

```bash
npm install
npm run dev
```

## 폴더 구조

```
src/
  App.jsx                 # 모든 화면 + 라우팅
  components/
    Icon.jsx              # SVG 아이콘 세트
    MapView.jsx           # Leaflet 지도 래퍼
  lib/
    supabase.js           # Supabase 클라이언트
    auth-context.jsx      # 로그인 상태
    data-context.jsx      # 전역 데이터 (artworks/places/...)
    db.js                 # Supabase 쿼리 함수
    exif.js               # 사진 EXIF GPS 추출
    geocoding.js          # Nominatim 역지오코딩 + 거리 계산
supabase/
  schema.sql              # DB 스키마 + RLS (Supabase에 한 번 실행)
SETUP.md                  # 처음 한 번 셋업 가이드
```

## 핵심 기능

- **사진 업로드** → EXIF에서 GPS 추출 → 동네 자동 매칭 → 지도에 표시
- **공개 방식 4종**: 정확한 위치 / 동네 / 개인전만 / 숨김 (RLS로 강제)
- **공간 전시**: 같은 동네에서 찍힌 사진들이 자동으로 묶임
- **개인전**: 4컷 큐레이션 + 25번째 사진(가장 아름다운) 선정
- **Hype + 댓글**: 다른 사람 사진에 반응 남기기
- **지도**: 실제 좌표 기반 Leaflet 지도, 내 위치 근처 공간 정렬
