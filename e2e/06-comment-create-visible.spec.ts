import { test, expect, stubApi, buildPost } from './helpers/api';

test('댓글을 작성하면 게시글 아래에 표시된다', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [buildPost({ id: 1, content: 'thread parent', author: 'alice' })],
    comments: { 1: [] },
  });

  await page.goto('/');

  // Open the comment thread for post 1.
  await page.getByLabel(/댓글/).first().click();

  // Type + submit a comment. Without a nickname, this triggers the prompt first.
  const commentInput = page.getByPlaceholder('댓글을 입력하세요...');
  await commentInput.fill('great thread');
  await commentInput.press('Enter');

  // Inline nickname prompt → set nickname.
  await page.getByPlaceholder('닉네임을 입력하세요').fill('commenter');
  await page.getByRole('button', { name: '[제출]' }).click();

  // Comment appears in the list along with its author inside the list item.
  await expect(page.getByText('great thread')).toBeVisible();
  const commentItem = page.getByRole('listitem').filter({ hasText: 'great thread' });
  await expect(commentItem.getByText('commenter')).toBeVisible();
});
