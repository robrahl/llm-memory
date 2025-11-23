import { test, expect } from '@playwright/test';

test.describe('UI smoke tests', () => {
  test('load main UI and find app root', async ({ page }) => {
    await page.goto('/ui');
    // page should load and contain the app root
    const app = await page.locator('#app');
    await expect(app).toBeVisible();
    // ensure title is correct
    await expect(page).toHaveTitle(/llm-memory Control Panel/i);
  });

  test('search page loads and has search input', async ({ page }) => {
    await page.goto('/ui');
    // try to find main search bar or textarea
    const searchInput = page.locator('textarea, input[type="search"], input[placeholder*="Search"], #query');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });
});
