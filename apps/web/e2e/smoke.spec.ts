import { expect, test } from '@playwright/test';

test('初回訪問はオンボーディングへ誘導される', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'はじめに、器具を教えてください' })).toBeVisible();
});
