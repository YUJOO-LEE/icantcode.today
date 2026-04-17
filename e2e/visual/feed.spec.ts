import { test, expect } from '@playwright/test';
import { stubApi, buildPost } from '../helpers/api';

test.use({
  viewport: { width: 1024, height: 720 },
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
});

test('feed-down-empty', async ({ page }) => {
  await stubApi(page, { status: 'down', posts: [] });
  await page.goto('/');
  await expect(page.getByText(/아직 게시글이 없습니다/)).toBeVisible();
  await expect(page).toHaveScreenshot('feed-down-empty.png', { fullPage: true });
});

test('feed-down-with-posts', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [
      buildPost({
        id: 2,
        content: 'second post here',
        author: 'bob',
        commentCount: 1,
        createdAt: '2026-03-31T12:00:00Z',
      }),
      buildPost({
        id: 1,
        content: 'first post here',
        author: 'alice',
        commentCount: 3,
        createdAt: '2026-03-31T10:00:00Z',
      }),
    ],
  });
  await page.goto('/');
  await expect(page.getByText('second post here')).toBeVisible();
  await expect(page.getByText('first post here')).toBeVisible();
  await expect(page).toHaveScreenshot('feed-down-with-posts.png', { fullPage: true });
});
