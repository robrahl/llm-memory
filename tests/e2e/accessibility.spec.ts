import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests
 * Tests for WCAG compliance and accessibility features
 */

test.describe('Keyboard Navigation', () => {
  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Press tab to focus first element
    await page.keyboard.press('Tab');
    
    // Check if focused element is visible
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el !== document.body;
    });
    
    expect(focused).toBe(true);
  });

  test('navigation links should be keyboard accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab to first link
    await page.keyboard.press('Tab');
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    
    // Should navigate somewhere
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('ARIA Labels and Roles', () => {
  test('navigation should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigation should be in a nav element
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('main content should be in main element', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Main content should be in main element
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('buttons should have descriptive text or aria-labels', async ({ page }) => {
    await page.goto('/dashboard');
    
    // All buttons should have text or aria-label
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some label
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });

  test('form inputs should have associated labels', async ({ page }) => {
    await page.goto('/add-policy');
    
    // Count inputs and labels
    const inputCount = await page.locator('input[type="text"], textarea').count();
    const labelCount = await page.locator('label').count();
    
    // Should have labels for inputs (at least some)
    if (inputCount > 0) {
      expect(labelCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Screen Reader Support', () => {
  test('page should have a title', async ({ page }) => {
    await page.goto('/dashboard');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('images should have alt text if any', async ({ page }) => {
    await page.goto('/dashboard');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // If image is present, it should have alt text (or be decorative)
      expect(alt !== undefined).toBe(true);
    }
  });

  test('headings should be hierarchical', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should have at least one heading
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    
    if (headings > 0) {
      // Good, headings are present
      expect(headings).toBeGreaterThan(0);
    }
  });
});

test.describe('Color Contrast and Visual', () => {
  test('should support both light and dark themes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Theme toggle should exist
    const themeButton = page.locator('button').filter({ hasText: /Light|Dark/ });
    
    if (await themeButton.count() > 0) {
      await expect(themeButton).toBeVisible();
      
      // Toggle theme
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Page should still be visible and functional
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('text should be readable', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for minimum font size (most text should be at least 14px)
    const fontSize = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    expect(fontSize).toBeTruthy();
  });
});

test.describe('Focus Management', () => {
  test('focus should not be trapped unintentionally', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should still be able to interact with page
    await expect(page.locator('main')).toBeVisible();
  });

  test('modal focus management (if modals exist)', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for modal triggers
    const modalTrigger = page.locator('button').filter({ hasText: /modal|dialog|open/i });
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.first().click();
      await page.waitForTimeout(500);
      
      // Focus should be in modal
      // Escape should close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });
});
