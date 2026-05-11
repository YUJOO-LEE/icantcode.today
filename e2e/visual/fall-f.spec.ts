import { test, expect, stubApi } from '../helpers/api';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
  await stubApi(page, { status: 'up' });
});

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
    await expect(page.getByText('$ fall -f')).toBeVisible();
    await expect(page.getByText('[TIMEOUT]')).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-initial-desktop.png', { fullPage: true });
  });

  test('Enter starts the game and renders a play field', async ({ page }) => {
    await page.goto('/game/fall-f?seed=42');
    await expect(page.getByText('$ fall -f')).toBeVisible();
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
    await page.getByText('$ fall -f').waitFor();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert').filter({ hasText: '[FAIL]' })).toBeVisible();
    await expect(page).toHaveScreenshot('fall-f-start-error-desktop.png', { fullPage: true });
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
    await page.getByText('$ fall -f').waitFor();
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
    await expect(page).toHaveScreenshot('fall-f-initial-mobile.png', { fullPage: true });
  });
});
