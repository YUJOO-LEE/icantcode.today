import { test, expect, stubApi } from './helpers/api';

test('한 세션 안에서는 닉네임을 재입력하지 않는다', async ({ page }) => {
  await stubApi(page, { status: 'down', posts: [] });

  await page.goto('/');

  // First submit → nickname prompt.
  await page.getByRole('button', { name: /post --new/ }).click();
  await page.getByPlaceholder('무슨 일이 있나요?').fill('post one');
  await page.getByRole('button', { name: '[제출]' }).click();

  // Set the nickname inline.
  const nicknameInput = page.getByPlaceholder('닉네임을 입력하세요');
  await nicknameInput.fill('morgan');
  await page.getByRole('button', { name: '[제출]' }).click();

  // First post should appear in the feed.
  await expect(page.getByText('post one')).toBeVisible();

  // Second submit in the same session should not re-prompt.
  await page.getByRole('button', { name: /post --new/ }).click();
  await page.getByPlaceholder('무슨 일이 있나요?').fill('post two');
  await page.getByRole('button', { name: '[제출]' }).click();

  await expect(page.getByText('post two')).toBeVisible();
  await expect(page.getByText(/set-nickname/)).toHaveCount(0);
});
