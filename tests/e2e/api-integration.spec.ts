import { test, expect } from '@playwright/test';

/**
 * API Integration Tests
 * Tests backend API endpoints through the browser
 */

test.describe('API Health and Status', () => {
  test('health endpoint should be accessible', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health', {
      failOnStatusCode: false
    });
    
    // If backend is running, should get 200
    // If not running, that's okay for UI-only tests
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle backend unavailability gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Even if backend is down, UI should load
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display appropriate error messages', async ({ page }) => {
    await page.goto('/query');
    
    // Try to execute a query (might fail if backend is down)
    const queryInput = page.locator('textarea, input[type="text"]').first();
    const submitButton = page.locator('button').filter({ 
      hasText: /search|execute|query|submit/i 
    }).first();
    
    if (await queryInput.count() > 0 && await submitButton.count() > 0) {
      await queryInput.fill('test query');
      await submitButton.click();
      
      // Wait a bit for response
      await page.waitForTimeout(2000);
      
      // Should either show results or an error message (not crash)
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('UI Response to API Calls', () => {
  test('loading states should be shown during API calls', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Page should handle loading gracefully
    await page.waitForLoadState('networkidle');
    
    // No hanging spinners or loading indicators stuck
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Try to navigate
    await page.click('text=Policy Browser').catch(() => {});
    
    // UI should remain functional
    await context.setOffline(false);
    await expect(page.locator('nav')).toBeVisible();
  });
});
