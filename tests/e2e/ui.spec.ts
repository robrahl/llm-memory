import { test, expect } from '@playwright/test';

test.describe('UI smoke tests', () => {
  test('load main UI and find app root', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // page should load and contain the app root
    const app = await page.locator('#app');
    await expect(app).toBeVisible();
    
    // ensure title is correct
    await expect(page).toHaveTitle(/llm-memory/i);
  });

  test('UI has navigation tabs', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Should have tabs for navigation
    const tabs = page.locator('.tabs.tabs-boxed');
    await expect(tabs).toBeVisible();
    
    // Should have main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
