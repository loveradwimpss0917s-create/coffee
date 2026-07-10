import { expect, test } from '@playwright/test';

test('ホームが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Coffee Recipe Lab' })).toBeVisible();
});
