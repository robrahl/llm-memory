import { test, expect } from '@playwright/test';

/**
 * Basic Navigation and UI Tests
 * Tests core navigation, routing, and UI elements
 */

test.describe('Navigation and Routing', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the app loads
    await expect(page).toHaveTitle(/llm-memory/i);
    
    // Check for navigation bar
    await expect(page.locator('nav.navbar')).toBeVisible();
    
    // Check for llm-memory brand
    await expect(page.locator('text=llm-memory')).toBeVisible();
  });

  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Click Dashboard link
    await page.click('text=Dashboard');
    
    // Verify URL
    await expect(page).toHaveURL('/dashboard');
    
    // Verify dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should navigate to Policy Browser', async ({ page }) => {
    await page.goto('/');
    
    // Click Policy Browser link
    await page.click('text=Policy Browser');
    
    // Verify URL
    await expect(page).toHaveURL('/policies');
    
    // Verify page loaded
    await expect(page.locator('text=Policy Browser')).toBeVisible();
  });

  test('should navigate to Query Tester', async ({ page }) => {
    await page.goto('/');
    
    // Click Query Tester link
    await page.click('text=Query Tester');
    
    // Verify URL
    await expect(page).toHaveURL('/query');
  });

  test('should navigate to Add Policy', async ({ page }) => {
    await page.goto('/');
    
    // Click Add Policy link
    await page.click('text=Add Policy');
    
    // Verify URL
    await expect(page).toHaveURL('/add-policy');
  });

  test('should have active nav link highlighting', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dashboard link should be active
    const dashboardLink = page.locator('a[href="/dashboard"]');
    await expect(dashboardLink).toHaveClass(/active/);
  });

  test('all navigation links should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check all main nav links exist
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Policy Browser')).toBeVisible();
    await expect(page.locator('text=Query Tester')).toBeVisible();
    await expect(page.locator('text=Add Policy')).toBeVisible();
  });
});

test.describe('Theme Switching', () => {
  test('should toggle between dark and light themes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find theme toggle button
    const themeButton = page.locator('button').filter({ hasText: /Light|Dark/ });
    await expect(themeButton).toBeVisible();
    
    // Get initial theme (default is dark)
    const initialClass = await page.locator('.d-flex').first().getAttribute('class');
    
    // Click theme toggle
    await themeButton.click();
    
    // Wait for theme to change
    await page.waitForTimeout(500);
    
    // Verify theme changed
    const newClass = await page.locator('.d-flex').first().getAttribute('class');
    expect(initialClass).not.toBe(newClass);
  });

  test('theme preference should persist', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Toggle theme
    const themeButton = page.locator('button').filter({ hasText: /Light|Dark/ });
    await themeButton.click();
    await page.waitForTimeout(500);
    
    // Get current theme
    const themeClass = await page.locator('.d-flex').first().getAttribute('class');
    
    // Navigate to another page
    await page.click('text=Policy Browser');
    await page.waitForURL('/policies');
    
    // Theme should persist
    const newThemeClass = await page.locator('.d-flex').first().getAttribute('class');
    expect(newThemeClass).toBe(themeClass);
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Mobile menu toggle should be visible
    const menuToggle = page.locator('.navbar-toggler');
    await expect(menuToggle).toBeVisible();
  });

  test('should display full nav on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    // Navigation items should be visible without toggle
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Policy Browser')).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('should display footer information', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check footer exists
    await expect(page.locator('footer')).toBeVisible();
    
    // Check footer content
    await expect(page.locator('text=/llm-memory v/i')).toBeVisible();
    await expect(page.locator('text=/Powered by/i')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should either redirect or show a 404
    // The app should not crash
    await expect(page.locator('nav.navbar')).toBeVisible();
  });
});
