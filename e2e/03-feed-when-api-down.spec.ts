import { test, expect, stubApi, buildPost } from './helpers/api';

test('API 장애 시 [ERR] 배너와 피드가 표시된다', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [buildPost({ id: 1, content: 'outage chat', author: 'alice' })],
  });

  await page.goto('/');

  await expect(page.getByText('[ERR]')).toBeVisible();
  await expect(page.getByText('outage chat')).toBeVisible();
  await expect(page.getByRole('button', { name: /post --new/ })).toBeVisible();
});
