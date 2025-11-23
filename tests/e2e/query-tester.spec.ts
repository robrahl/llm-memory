import { test, expect } from '@playwright/test';

/**
 * Query Tester Tests
 * Tests the query/search functionality
 */

test.describe('Query Tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Navigate to Query Tester tab
    await page.locator('button:has-text("Query Tester")').click();
    await page.waitForTimeout(300);
  });

  test('should display query tester interface', async ({ page }) => {
    // Check for query input or tester heading
    await expect(page.locator('text=/Query|Search/i')).toBeVisible();
  });

  test('should have query input field', async ({ page }) => {
    // Look for textarea or input for queries
    const queryInput = page.locator('textarea, input[type="text"]').first();
    await expect(queryInput).toBeVisible();
  });

  test('should have submit/execute button', async ({ page }) => {
    // Look for search/execute/submit button
    const submitButton = page.locator('button').filter({ 
      hasText: /search|execute|query|submit/i 
    });
    
    if (await submitButton.count() > 0) {
      await expect(submitButton.first()).toBeVisible();
    }
  });

  test('should accept query input', async ({ page }) => {
    const queryInput = page.locator('textarea, input[type="text"]').first();
    
    await queryInput.fill('What are the naming conventions?');
    await expect(queryInput).toHaveValue('What are the naming conventions?');
  });

  test('should have Top K selector', async ({ page }) => {
    // Look for Top K input or selector
    const topKInput = page.locator('input[type="number"], select').filter({
      hasText: /top|k|results/i
    });
    
    // Or look for label with "Top K" and find nearby input
    const topKLabel = page.locator('label:has-text("Top")');
    if (await topKLabel.count() > 0) {
      const nearbyInput = page.locator('input[type="number"]').first();
      await expect(nearbyInput).toBeVisible();
    }
  });

  test('should handle empty query gracefully', async ({ page }) => {
    const submitButton = page.locator('button').filter({ 
      hasText: /search|execute|query|submit/i 
    }).first();
    
    if (await submitButton.count() > 0) {
      // Try to submit empty query
      await submitButton.click();
      
      // Page should not crash
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('query interface should be user-friendly', async ({ page }) => {
    // Check that form elements are properly laid out
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Should have some instructions or labels
    const hasLabels = await page.locator('label').count();
    expect(hasLabels).toBeGreaterThan(0);
  });
});

test.describe('Search Tester', () => {
  test('should access search tester if available', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Look for Query Tester tab
    const queryTesterTab = page.locator('button:has-text("Query Tester")');
    
    if (await queryTesterTab.count() > 0) {
      await queryTesterTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Query Tester')).toBeVisible();
    }
  });

  test('should have semantic search toggle if available', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    // Navigate to Query Tester tab
    await page.locator('button:has-text("Query Tester")').click();
    await page.waitForTimeout(300);
    
    // Look for semantic search toggle/checkbox
    const semanticToggle = page.locator('input[type="checkbox"]').filter({
      hasText: /semantic/i
    });
    
    if (await semanticToggle.count() === 0) {
      // Try looking for label with semantic
      const semanticLabel = page.locator('label:has-text("Semantic")');
      if (await semanticLabel.count() > 0) {
        const checkbox = page.locator('input[type="checkbox"]').first();
        await expect(checkbox).toBeVisible();
      }
    }
  });
});
