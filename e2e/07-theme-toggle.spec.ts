import { test, expect, stubApi } from './helpers/api';

test('다크 ↔ 라이트 테마를 전환할 수 있다', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');

  const html = page.locator('html');
  await expect(html).toHaveClass(/dark/);

  // Header toggle shows the *target* theme label (밝게 when currently dark).
  await page.getByRole('button', { name: /밝게 모드로 전환/ }).click();
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole('button', { name: /어둡게 모드로 전환/ }).click();
  await expect(html).toHaveClass(/dark/);
});
