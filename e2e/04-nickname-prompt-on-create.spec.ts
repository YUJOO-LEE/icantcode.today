import { test, expect, stubApi } from './helpers/api';

test('opens nickname prompt inline when submitting without a nickname', async ({ page }) => {
  await stubApi(page, { status: 'down', posts: [] });

  await page.goto('/');

  // Open composer, type, submit.
  await page.getByRole('button', { name: /post --new/ }).click();
  const textarea = page.getByPlaceholder('무슨 일이 있나요?');
  await textarea.fill('first try without nickname');
  await page.getByRole('button', { name: '[제출]' }).click();

  // Inline prompt appears (no modal; renders in place of the composer).
  await expect(page.getByText(/set-nickname/)).toBeVisible();
  await expect(page.getByPlaceholder('닉네임을 입력하세요')).toBeVisible();
});
