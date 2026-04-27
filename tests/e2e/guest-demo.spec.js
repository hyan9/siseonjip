// 시선집 E2E — 익명 체험 흐름
// 사전 조건: dev 서버 실행 중 (http://localhost:5173), Supabase 익명 로그인 활성화.
// 실행: npx playwright test tests/e2e/guest-demo.spec.js

import { test, expect } from '@playwright/test';

test.describe('익명 체험 시작 흐름', () => {
  test('체험하기 → 봇 작품이 시선집 list에 보임 → 캘린더 25칸 인디케이터', async ({ page }) => {
    await page.goto('/');

    // 1) 로그인 화면 — "체험하기" 버튼이 가장 위에 큼지막하게
    const guestBtn = page.getByRole('button', { name: /체험하기/ });
    await expect(guestBtn).toBeVisible();
    await guestBtn.click();

    // 2) 메인 진입 — TopBar에 "시선집" 노출
    await expect(page.getByRole('button', { name: '시선집 홈' })).toBeVisible();

    // 3) 추천 탭이 기본 선택, 오늘의 한 컷 카드 노출
    await expect(page.getByText('오늘의 한 컷')).toBeVisible({ timeout: 10000 });

    // 4) 실시간 탭 → 봇 작품 제목 중 하나 보임
    await page.getByRole('button', { name: '실시간', exact: true }).click();
    await expect(page.getByText(/이끼|소금|리넨|느와르|주전자/)).toBeVisible();

    // 5) 캘린더 진입 → 25칸 진행률 카드
    await page.getByRole('button', { name: /필름/ }).click();
    await expect(page.getByText(/ROLL|24장/)).toBeVisible();
  });

  test('봇 프로필에서 follow 누르면 안내 alert', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /체험하기/ }).click();
    await page.getByRole('button', { name: '실시간', exact: true }).click();

    // 봇 작품 한 줄 클릭 → ArtworkDetail
    await page.getByText('이끼').first().click();

    // 작가 프로필로 이동
    await page.getByText(/이끼/).first().click();

    // follow 버튼 노출되어 있어야 함
    const followBtn = page.getByRole('button', { name: /팔로우/ });
    await expect(followBtn).toBeVisible();

    // 클릭 시 alert
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('데모 봇');
      await dialog.dismiss();
    });
    await followBtn.click();
  });
});
