import { test, expect, stubApi } from './helpers/api';

test('API 정상 시 랜딩 화면만 보이고 피드는 숨겨진다', async ({ page }) => {
  await stubApi(page, { status: 'up' });

  await page.goto('/');

  await expect(page.getByText(/Claude Code API가 정상입니다/)).toBeVisible();
  // Feed should not render when healthy — no composer button visible.
  await expect(page.getByRole('button', { name: /post --new|writing new post/ })).toHaveCount(0);
});
