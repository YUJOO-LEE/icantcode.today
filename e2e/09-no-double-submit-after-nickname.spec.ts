import { test, expect, stubApi, buildPost } from './helpers/api';

/**
 * Regression coverage for the duplicate-submit bug.
 *
 * Before the fix: submitting a post or comment without a nickname would queue
 * the action via a stale closure and remount the composer's input with
 * `autoFocus`. Confirming the inline nickname prompt fired the mutation, then
 * Enter key-repeat (or focus chain artefacts) landed on the freshly remounted
 * input and triggered a second `mutate` call. The user would see one item
 * registered server-side AND a "submission failed" error toast.
 *
 * After the fix: the composer's input stays mounted for the entire prompt
 * lifecycle, the deferred submission runs through a ref instead of a captured
 * closure, and the prompt-complete callback fires the mutation exactly once.
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
  // No phantom error must appear: previously the mutation-level onSuccess
  // crashed inside `setQueriesData` (wrong cache shape), forcing a successful
  // POST into the mutate-call-level onError path.
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.waitForTimeout(200);
  expect(commentCount).toBe(1);

  // Comment input is back, empty, no stale value
  await expect(page.getByPlaceholder('댓글을 입력하세요...')).toHaveValue('');
});
