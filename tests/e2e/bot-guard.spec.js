// 봇 작품에 hype/save/comment 시도 시 alert로 가드되는지 검증
import { test, expect } from '@playwright/test';

test.describe('봇 가드', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /체험하기/ }).click();
    // 메인 진입까지 대기
    await expect(page.getByRole('button', { name: '시선집 홈' })).toBeVisible({ timeout: 15000 });
  });

  test('봇 작품에서 hype 누르면 alert + DB 호출 차단', async ({ page }) => {
    // 실시간 list로 가서 봇 작품 진입
    await page.getByRole('button', { name: '실시간', exact: true }).click();
    await page.getByText(/이끼|소금|리넨|느와르|주전자/).first().click();

    // 사진 아래 별 버튼
    let dialogShown = false;
    page.once('dialog', async (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toMatch(/데모 봇/);
      await dialog.dismiss();
    });
    await page.getByTitle('Hype').click();
    await expect.poll(() => dialogShown).toBe(true);
  });

  test('봇 작품에서 댓글 등록 시도 시 alert', async ({ page }) => {
    await page.getByRole('button', { name: '실시간', exact: true }).click();
    await page.getByText(/이끼|소금/).first().click();

    await page.getByPlaceholder('댓글…').fill('테스트');

    let dialogShown = false;
    page.once('dialog', async (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toMatch(/데모 봇/);
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: '등록' }).click();
    await expect.poll(() => dialogShown).toBe(true);
  });
});
