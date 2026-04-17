import { test, expect } from '@playwright/test';
import { stubApi } from './helpers/api';

test('shows the landing view and hides the feed when API is normal', async ({ page }) => {
  await stubApi(page, { status: 'up' });

  await page.goto('/');

  await expect(page.getByText(/Claude Code API가 정상입니다/)).toBeVisible();
  // Feed should not render when healthy — no composer button visible.
  await expect(page.getByRole('button', { name: /post --new|writing new post/ })).toHaveCount(0);
});
