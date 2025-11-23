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
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Dashboard heading or System Status should be visible
    await expect(page.locator('text=System Status')).toBeVisible();
  });

  test('should display status cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Dashboard should have status cards (Agent, PostgreSQL, LLM Provider)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check for status cards
    await expect(page.locator('text=Agent')).toBeVisible();
    await expect(page.locator('text=PostgreSQL')).toBeVisible();
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
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Main dashboard content should be visible
    await expect(page.locator('text=System Status')).toBeVisible();
  });
});
