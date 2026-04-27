# 카든냥 E2E 테스트

이미 Playwright + chromium이 설치돼 있고 `playwright.config.js`도 들어가 있어요.

## 빠르게 시작

```bash
# 헤드리스
npm run test:e2e

# UI 모드 (트레이스/스텝 보면서 디버깅)
npm run test:e2e:ui
```

`webServer`가 `npm run dev`를 자동으로 띄우므로 별도로 dev 서버 켤 필요 없음.

## 실행 전 확인

테스트는 Supabase에 의존합니다 (체험하기 = 익명 로그인).

- `.env.local`에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 설정
- Supabase Auth → Providers → **Anonymous Sign-Ins ON**

이 두 가지가 안 되면 LoginScreen에서 "Setup needed"가 떠 모든 테스트가 실패해요.

## 작성된 시나리오

| 파일 | 흐름 | 우선순위 |
|---|---|---|
| `e2e/guest-demo.spec.js` | 익명 로그인 → 봇 작품 보임 → 카든냥 list 스크롤 → 캘린더 25칸 진행률 보임 | High |
| `e2e/film-flow.spec.js` | 기록 진입 → 4-slot grid에서 + 추가 → 4장 다 차면 + 사라짐 → 마스코트 등장 | High |
| `e2e/follow-modal.spec.js` | 봇 프로필 진입 → 팔로워/팔로잉 클릭 → 리스트 모달 → 행 클릭 → 다른 봇 프로필 | Mid |
| `e2e/twenty-five.spec.js` | 캘린더 → "25번째 고르기" → 사진 선택 → 축하 모먼트 mascot → 캘린더로 복귀 | Mid |

## playwright.config.js 권장 설정

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

## 추후 추가하고 싶은 시나리오

- 다크모드 토글 후 색 컨트라스트 검증 (image-bg)
- 봇 작품에 hype 누르면 alert 뜨는지 (DB 보호 가드)
- 캘린더 일주일 뷰 스크롤 → 오늘 블록 opacity 1 확인
- TopBar 메뉴 드롭다운 → 각 메뉴 항목 클릭 시 라우팅 OK
