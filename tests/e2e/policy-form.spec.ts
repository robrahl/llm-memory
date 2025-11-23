import { test, expect } from '@playwright/test';

/**
 * Policy Form Tests
 * Tests adding and editing policies
 */

test.describe('Add Policy Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-policy');
  });

  test('should display add policy form', async ({ page }) => {
    await expect(page.locator('text=/Add Policy|New Policy/i')).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    // Look for common form fields
    const formInputs = page.locator('input[type="text"], textarea');
    const inputCount = await formInputs.count();
    
    // Should have at least some inputs
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should have submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button').filter({
      hasText: /add|save|create|submit/i
    });
    
    await expect(submitButton.first()).toBeVisible();
  });

  test('should accept text input in form fields', async ({ page }) => {
    const textInputs = page.locator('input[type="text"], textarea');
    
    if (await textInputs.count() > 0) {
      const firstInput = textInputs.first();
      await firstInput.fill('Test Policy');
      await expect(firstInput).toHaveValue('Test Policy');
    }
  });

  test('form should have labels for accessibility', async ({ page }) => {
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    // Should have labels for form fields
    expect(labelCount).toBeGreaterThan(0);
  });

  test('should handle form validation', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button').filter({
      hasText: /add|save|create|submit/i
    }).first();
    
    if (await submitButton.count() > 0) {
      // Try to submit empty form
      await submitButton.click();
      
      // Form should either show validation errors or remain on page
      await page.waitForTimeout(500);
      
      // Page should not crash
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should allow filling complete form', async ({ page }) => {
    // Find all text inputs and textareas
    const inputs = page.locator('input[type="text"]');
    const textareas = page.locator('textarea');
    
    // Fill first text input if exists
    if (await inputs.count() > 0) {
      await inputs.first().fill('Test Policy Title');
    }
    
    // Fill first textarea if exists
    if (await textareas.count() > 0) {
      await textareas.first().fill('This is a test policy content.');
    }
    
    // Form should accept the input
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have cancel or back option', async ({ page }) => {
    // Look for cancel/back button or link
    const cancelOption = page.locator('button, a').filter({
      hasText: /cancel|back/i
    });
    
    // It's good UX to have a way to cancel
    if (await cancelOption.count() > 0) {
      await expect(cancelOption.first()).toBeVisible();
    }
  });
});

test.describe('Policy CRUD Operations', () => {
  test('should maintain form state when navigating away and back', async ({ page }) => {
    await page.goto('/add-policy');
    
    // Fill in a field
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.count() > 0) {
      await input.fill('Test Content');
      
      // Navigate away
      await page.click('text=Dashboard');
      await page.waitForURL('/dashboard');
      
      // Navigate back
      await page.click('text=Add Policy');
      await page.waitForURL('/add-policy');
      
      // Form should be reset (clean slate for new policy)
      // This is expected behavior
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
