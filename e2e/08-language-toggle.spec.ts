import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api';

test('toggles UI language between ko and en', async ({ page }) => {
  await stubApi(page, { status: 'up' });
  await page.goto('/');

  // Starts in Korean.
  await expect(page.getByText(/Claude Code API가 정상입니다/)).toBeVisible();

  // Header toggle shows the *target* language label (English when currently ko).
  await page.getByRole('button', { name: /English로 전환/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText(/Claude Code API is online/)).toBeVisible();

  // After toggling to en, the aria-label rotates into English too.
  await page.getByRole('button', { name: /Switch to 한국어/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByText(/Claude Code API가 정상입니다/)).toBeVisible();
});
