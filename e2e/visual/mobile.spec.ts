import { test, expect, stubApi } from '../helpers/api';

test.use({
  viewport: { width: 375, height: 667 },
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-04-01T00:00:00Z') });
});

test('시각 스냅샷: 모바일 랜딩 (footer 두 줄, 우측 정렬, [GITHUB])', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');
  await expect(page.getByText(/피드는 장애 시에만 열립니다/)).toBeVisible();
  // Footer link is rendered with the [GITHUB] bracketed label, matching
  // the [N]/[T]/[L] shortcut group, and is laid out on a second row.
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /GitHub/i })).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-landing.png', { fullPage: true });
});

test('시각 스냅샷: 모바일 장애 화면 (statusPage minor)', async ({ page }) => {
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
  await expect(page).toHaveScreenshot('mobile-outage-minor.png', { fullPage: true });
});
