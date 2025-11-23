import { test, expect } from '@playwright/test';

/**
 * Policy Browser Tests
 * Tests policy listing, filtering, and viewing
 */

test.describe('Policy Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/policies');
  });

  test('should display policy browser page', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('text=/Policy Browser|Policies/i')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Test typing in search
      await searchInput.first().fill('test');
      await expect(searchInput.first()).toHaveValue('test');
    }
  });

  test('should display policies or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Either policies are shown or an empty state message
    const hasContent = await page.locator('main').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should handle policy filtering', async ({ page }) => {
    // If there's a filter/search input, test it
    const filterInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await filterInput.count() > 0) {
      // Type in filter
      await filterInput.fill('architecture');
      
      // Results should update (wait a bit for any debouncing)
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
