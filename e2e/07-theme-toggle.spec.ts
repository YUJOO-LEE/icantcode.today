import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api';

test('toggles between dark and light theme', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');

  const html = page.locator('html');
  await expect(html).toHaveClass(/dark/);

  // Header toggle shows the *target* theme label (밝게 when currently dark).
  await page.getByRole('button', { name: /밝게 모드로 전환/ }).click();
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole('button', { name: /어둡게 모드로 전환/ }).click();
  await expect(html).toHaveClass(/dark/);
});
