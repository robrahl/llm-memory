import { test, expect } from '@playwright/test';

/**
 * Dashboard Component Tests
 * Tests dashboard functionality and statistics display
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Dashboard tab should be active by default, but if not, click it
    const isDashboardActive = await page.locator('button:has-text("Dashboard")').evaluate((el) => {
      return el.classList.contains('tab-active');
    });
    
    if (!isDashboardActive) {
      await page.locator('button:has-text("Dashboard")').click();
      await page.waitForTimeout(300);
    }
  });

  test('should display dashboard title', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Dashboard heading or System Status should be visible
    await expect(page.locator('text=System Status')).toBeVisible();
  });

  test('should display status cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Dashboard should have status cards with specific structure
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check for status cards by looking for the card structure
    await expect(page.locator('.card-title:has-text("Agent")')).toBeVisible();
    await expect(page.locator('.card-title:has-text("PostgreSQL")')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Page should load without errors
    await page.waitForLoadState('networkidle');
    
    // No error messages should be visible
    const errorMessages = page.locator('text=/error/i').filter({ hasText: /failed|error/i });
    await expect(errorMessages).toHaveCount(0);
  });

  test('dashboard should be the default view', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Dashboard tab should be active by default
    const dashboardTab = page.locator('button:has-text("Dashboard")');
    await expect(dashboardTab).toHaveClass(/tab-active/);
    
    // Main dashboard content should be visible
    await expect(page.locator('text=System Status')).toBeVisible();
  });
});
