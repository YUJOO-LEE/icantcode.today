import { test, expect, stubApi } from '../helpers/api';

test.use({
  viewport: { width: 1024, height: 720 },
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
});

test('시각 스냅샷: outage banner — statusPage minor (인디케이터 색 적용)', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [],
    models: [
      { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
      { model: 'claude-opus-4-7', status: 'HEALTHY', responseTimeMs: 1455 },
      { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 626 },
    ],
    statusPage: {
      indicator: 'minor',
      description: 'Partially Degraded Service',
      message: null,
      components: [
        { name: 'Claude API (api.anthropic.com)', status: 'degraded_performance' },
      ],
    },
  });
  await page.goto('/');
  const banner = page.getByRole('status').first();
  await expect(banner).toBeVisible();
  await expect(banner.getByText(/\[MINOR\]/)).toBeVisible();
  await expect(banner).toHaveScreenshot('outage-banner-minor.png');
});

test('시각 스냅샷: outage banner — opus FAIL + minor (모델 우선순위)', async ({ page }) => {
  await stubApi(page, {
    status: 'down',
    posts: [],
    models: [
      { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
      { model: 'claude-opus-4-7', status: 'DOWN', responseTimeMs: 0 },
      { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 800 },
    ],
    statusPage: {
      indicator: 'minor',
      description: 'Partially Degraded Service',
      message: null,
      components: [
        { name: 'Claude API (api.anthropic.com)', status: 'degraded_performance' },
      ],
    },
  });
  await page.goto('/');
  const banner = page.getByRole('status').first();
  await expect(banner).toBeVisible();
  await expect(banner.getByText(/\[FAIL\]/)).toBeVisible();
  await expect(banner.getByText(/\[MINOR\]/)).toBeVisible();
  await expect(banner).toHaveScreenshot('outage-banner-opus-fail-minor.png');
});
