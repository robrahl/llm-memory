import { test } from '@playwright/test';

test('inspect page', async ({ page }) => {
  await page.goto('http://localhost:5174');
  
  // Wait for the app to load
  await page.waitForTimeout(2000);
  
  // Get the page content
  const content = await page.content();
  console.log('=== PAGE HTML ===');
  console.log(content);
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/ui-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/ui-screenshot.png');
  
  // Check for specific elements
  console.log('\n=== ELEMENT CHECK ===');
  const hasNav = await page.locator('nav').count();
  console.log('nav elements:', hasNav);
  
  const hasNavbar = await page.locator('nav.navbar').count();
  console.log('nav.navbar elements:', hasNavbar);
  
  const hasMain = await page.locator('main').count();
  console.log('main elements:', hasMain);
  
  const hasDashboardText = await page.locator('text=Dashboard').count();
  console.log('Dashboard text elements:', hasDashboardText);
  
  const allText = await page.textContent('body');
  console.log('\n=== PAGE TEXT ===');
  console.log(allText?.substring(0, 500));
});
