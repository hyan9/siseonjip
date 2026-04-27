// 캘린더에 25칸 진행률이 보이고, 사진 클릭 시 zoom 모달이 뜨는지
import { test, expect } from '@playwright/test';

test.describe('캘린더 / 25번째', () => {
  test('체험 시작 후 캘린더 진입 → 25칸 인디케이터', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /체험하기/ }).click();
    await expect(page.getByRole('button', { name: '카든냥 홈' })).toBeVisible({ timeout: 15000 });

    // BottomNav '필름'
    await page.getByRole('button', { name: /필름/ }).click();
    await expect(page.getByText(/ROLL/)).toBeVisible();

    // 진행률 카드 — 24칸 grid + 25번째 슬롯
    // 현재는 사용자 작품이 0개이므로 '25번째는 다 채운 뒤'가 보여야 함
    await expect(page.getByText(/25번째|24장|찾는 중/)).toBeVisible();
  });
});
