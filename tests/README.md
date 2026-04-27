# 시선집 E2E 테스트

## 빠르게 시작

```bash
# 1) Playwright 설치 (한 번만)
npm install -D @playwright/test
npx playwright install chromium

# 2) dev 서버를 다른 터미널에서 띄워두고
npm run dev

# 3) 테스트 실행
npx playwright test --ui   # GUI 모드
npx playwright test        # 헤드리스
```

또는 `playwright.config.js`에 `webServer` 옵션을 추가하면 자동으로 dev 서버 띄움 (config 예시는 아래).

## 작성된 시나리오

| 파일 | 흐름 | 우선순위 |
|---|---|---|
| `e2e/guest-demo.spec.js` | 익명 로그인 → 봇 작품 보임 → 시선집 list 스크롤 → 캘린더 25칸 진행률 보임 | High |
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
