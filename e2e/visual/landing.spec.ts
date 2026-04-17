import { test, expect } from '@playwright/test';
import { stubApi } from '../helpers/api';

test.use({
  viewport: { width: 1024, height: 720 },
});

test.beforeEach(async ({ page }) => {
  // Disable motion + freeze clock for deterministic screenshots.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
});

test('landing-ko', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');
  // Wait for the static footnote (not animated) so the typewriter area is settled.
  await expect(page.getByText(/피드는 장애 시에만 열립니다/)).toBeVisible();
  await expect(page).toHaveScreenshot('landing-ko.png', { fullPage: true });
});

test('landing-en', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');
  await page.getByRole('button', { name: /English로 전환/ }).click();
  await expect(page.getByText(/Feed is only available during outages/)).toBeVisible();
  await expect(page).toHaveScreenshot('landing-en.png', { fullPage: true });
});

test('theme-light', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');
  await page.getByRole('button', { name: /밝게 모드로 전환/ }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByText(/피드는 장애 시에만 열립니다/)).toBeVisible();
  await expect(page).toHaveScreenshot('theme-light.png', { fullPage: true });
});
