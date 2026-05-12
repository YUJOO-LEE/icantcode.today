import type { Page } from '@playwright/test';
import { test, expect, stubApi } from '../helpers/api';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
  await stubApi(page, { status: 'up' });
});

/**
 * Wait until the fall -f start screen is interactive. `$ fall -f` ships in the
 * prerendered HTML, so its presence doesn't prove React has hydrated and the
 * Enter-to-start key listener is attached. The leaderboard rows only appear
 * after a client-side fetch + render, so once they're visible hydration is done.
 */
async function waitForStartScreenReady(page: Page): Promise<void> {
  await expect(page.getByText('$ fall -f')).toBeVisible();
  await expect(
    page.getByRole('region', { name: /leaderboard/ }).getByText('segfault-sam'),
  ).toBeVisible();
}

test.describe('fall -f — desktop', () => {
  test.use({ viewport: { width: 1024, height: 720 } });

  test('catalog page', async ({ page }) => {
    await page.goto('/game');
    await expect(page.getByText('$ ls -la /game/')).toBeVisible();
    await expect(page.getByRole('link', { name: 'fall-f' })).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-catalog-desktop.png', { fullPage: true });
  });

  test('initial screen', async ({ page }) => {
    await page.goto('/game/fall-f');
    await expect(page.getByText('[TIMEOUT]')).toBeVisible();
    await waitForStartScreenReady(page);
    await expect(page).toHaveScreenshot('fall-f-initial-desktop.png', { fullPage: true });
  });

  test('initial screen — empty leaderboard', async ({ page }) => {
    await stubApi(page, { status: 'up', ranking: [] });
    await page.goto('/game/fall-f');
    await expect(page.getByText('$ fall -f')).toBeVisible();
    await expect(page.getByRole('region', { name: /leaderboard/ })).toContainText(
      '아직 기록이 없어요',
    );
    await expect(page).toHaveScreenshot('fall-f-initial-empty-ranking-desktop.png', {
      fullPage: true,
    });
  });

  test('Enter starts the game and renders a play field', async ({ page }) => {
    await page.goto('/game/fall-f?seed=42');
    await waitForStartScreenReady(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="application"][aria-label="fall -f game"]')).toBeVisible();
  });
});

test.describe('fall -f — score API screens', () => {
  test.use({ viewport: { width: 1024, height: 720 } });

  test('start error screen when /games/start fails', async ({ page }) => {
    await page.route('**/games/start', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/game/fall-f');
    await waitForStartScreenReady(page);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert').filter({ hasText: '[FAIL]' })).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-start-error-desktop.png', { fullPage: true });
  });

  test('result screen renders the death summary, submit form and leaderboard', async ({
    page,
  }) => {
    await page.goto('/game/fall-f?seed=42');
    await waitForStartScreenReady(page);
    await page.keyboard.press('Enter');
    await page
      .locator('[role="application"][aria-label="fall -f game"]')
      .waitFor();
    // Advance the (clock-frozen) rAF loop until the run ends. With no input the
    // player drops through the platforms and the run terminates on its own.
    await page.clock.runFor(20_000);
    await expect(page.getByRole('alert').filter({ hasText: 'core dumped' })).toBeVisible();
    await expect(page.getByText('── submit score ──')).toBeVisible();
    await expect(
      page.getByRole('region', { name: /leaderboard/ }).getByText('segfault-sam'),
    ).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-result-desktop.png', { fullPage: true });
  });

  test('loading screen while /games/start is in flight', async ({ page }) => {
    // Defer the response so the LoadingScreen stays on screen long enough to
    // screenshot.
    await page.route('**/games/start', async (route) => {
      await new Promise((r) => setTimeout(r, 5_000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: '550e8400-e29b-41d4-a716-446655440000' }),
      });
    });
    await page.goto('/game/fall-f');
    await waitForStartScreenReady(page);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: '[BOOT]' })).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-loading-desktop.png', { fullPage: true });
  });
});

test.describe('fall -f — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('catalog page', async ({ page }) => {
    await page.goto('/game');
    await expect(page.getByText('$ ls -la /game/')).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-catalog-mobile.png', { fullPage: true });
  });

  test('initial screen', async ({ page }) => {
    await page.goto('/game/fall-f');
    await expect(page.getByText('$ fall -f')).toBeVisible();
    await expect(
      page.getByRole('region', { name: /leaderboard/ }).getByText('segfault-sam'),
    ).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-initial-mobile.png', { fullPage: true });
  });
});
