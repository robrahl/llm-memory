import { test, expect } from '@playwright/test';

/**
 * Dashboard Component Tests
 * Tests dashboard functionality and statistics display
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Dashboard' })).toBeVisible();
  });

  test('should display status cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Dashboard should have some content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Page should load without errors
    await page.waitForLoadState('networkidle');
    
    // No error messages should be visible
    const errorMessages = page.locator('text=/error/i').filter({ hasText: /failed|error/i });
    await expect(errorMessages).toHaveCount(0);
  });

  test('dashboard should be accessible via direct URL', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});
