import { test, expect, stubApi, buildPost } from './helpers/api';

/**
 * Invariants verified end-to-end:
 *  - Confirming the inline nickname prompt fires the create-post / create-comment
 *    mutation exactly once.
 *  - The composer's input stays mounted for the entire prompt lifecycle so
 *    autoFocus + Enter key-repeat on a remounted input can't trigger a second
 *    `mutate`.
 *  - The deferred submission runs through a ref, not a captured closure, so
 *    the in-flight value is stable across the prompt.
 *  - No "submission failed" alert appears when the POST actually succeeded.
 */

test('post: confirming the inline nickname prompt fires create-post exactly once and surfaces no error', async ({ page }) => {
  await stubApi(page, { status: 'down', posts: [] });

  // Count post-create requests at the network layer (route stub interception)
  // because Playwright's normal request listener may miss stubbed routes.
  let postCount = 0;
  await page.route('https://api.icantcode.bubu.dev/posts', async (route) => {
    if (route.request().method() === 'POST') {
      postCount += 1;
      await new Promise((r) => setTimeout(r, 25));
    }
    await route.fallback();
  });

  await page.goto('/');

  await page.getByRole('button', { name: /post --new/ }).click();
  await page.getByPlaceholder('무슨 일이 있나요?').fill('regression body');
  await page.getByRole('button', { name: '[제출]' }).click();

  // Confirm the inline nickname via Enter — historical reproduction trigger
  // (Enter on the prompt + Enter key-repeat onto the just-remounted textarea).
  const nicknameInput = page.getByPlaceholder('닉네임을 입력하세요');
  await nicknameInput.fill('regression-tester');
  await nicknameInput.press('Enter');

  // The submitted post appears in the feed once
  await expect(page.getByText('regression body')).toBeVisible();
  // No error banner / alert should ever appear
  await expect(page.getByRole('alert')).toHaveCount(0);

  // Settle, then assert exactly one POST hit the network
  await page.waitForTimeout(200);
  expect(postCount).toBe(1);

  // The composer has collapsed back to its CLI prompt
  await expect(page.getByRole('button', { name: /post --new/ })).toBeVisible();
});

test('comment: confirming the inline nickname prompt fires create-comment exactly once and surfaces no error', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [buildPost({ id: 1, content: 'thread parent', author: 'alice' })],
    comments: { 1: [] },
  });

  let commentCount = 0;
  await page.route('https://api.icantcode.bubu.dev/posts/1/comments', async (route) => {
    if (route.request().method() === 'POST') {
      commentCount += 1;
      await new Promise((r) => setTimeout(r, 25));
    }
    await route.fallback();
  });

  await page.goto('/');

  // Open the comment thread for post 1
  await page.getByLabel(/댓글/).first().click();

  const commentInput = page.getByPlaceholder('댓글을 입력하세요...');
  await commentInput.fill('regression comment');
  await commentInput.press('Enter');

  const nicknameInput = page.getByPlaceholder('닉네임을 입력하세요');
  await nicknameInput.fill('regression-commenter');
  await nicknameInput.press('Enter');

  await expect(page.getByText('regression comment')).toBeVisible();
  // No phantom error: the mutation-level `onSuccess` updater must handle
  // both `['posts']` cache shapes so a successful POST never bubbles into
  // the mutate-call-level `onError` path via a `setQueriesData` crash.
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.waitForTimeout(200);
  expect(commentCount).toBe(1);

  // Comment input is back, empty, no stale value
  await expect(page.getByPlaceholder('댓글을 입력하세요...')).toHaveValue('');
});
