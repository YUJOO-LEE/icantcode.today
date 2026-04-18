import { test, expect, stubApi, buildPost } from './helpers/api';

test('닉네임 없이도 피드를 읽을 수 있다', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [
      buildPost({ id: 1, content: 'first post', author: 'alice' }),
      buildPost({ id: 2, content: 'second post', author: 'bob' }),
    ],
  });

  await page.goto('/');

  await expect(page.getByText('first post')).toBeVisible();
  await expect(page.getByText('second post')).toBeVisible();
  // No nickname prompt should appear just from reading
  await expect(page.getByText(/set-nickname/)).toHaveCount(0);
});
