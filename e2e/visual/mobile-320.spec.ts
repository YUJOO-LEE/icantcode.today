import { test, expect, stubApi, buildPost } from '../helpers/api';

// 320px is the narrowest width we support. These baselines lock the
// terminal layout (header prompt, feed cards, comment thread) at that width
// so a future change can't silently reintroduce horizontal overflow.
test.use({
  viewport: { width: 320, height: 568 },
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
});

test('시각 스냅샷: 320px 랜딩', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');
  await expect(page.getByText(/피드는 장애 시에만 열립니다/)).toBeVisible();
  await expect(page).toHaveScreenshot('mobile320-landing.png', { fullPage: true });
});

test('시각 스냅샷: 320px 장애 피드 (긴 작성자명·댓글)', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [
      buildPost({
        id: 1,
        content: 'cannot ship anything until the API is back up',
        author: 'a-very-long-handle-99',
        commentCount: 1,
        createdAt: '2026-03-31T12:00:00Z',
      }),
    ],
    comments: {
      1: [
        {
          id: 1,
          postId: 1,
          content: 'same here, refreshing every minute',
          author: 'another-long-handle-7',
          createdAt: '2026-03-31T12:30:00Z',
        },
      ],
    },
  });
  await page.goto('/');
  await expect(page.getByText(/cannot ship anything/)).toBeVisible();
  await page.getByLabel(/댓글/).first().click();
  await expect(page.getByText(/same here/)).toBeVisible();
  await expect(page).toHaveScreenshot('mobile320-feed.png', { fullPage: true });
});
