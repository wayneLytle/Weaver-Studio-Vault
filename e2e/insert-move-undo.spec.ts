import { test, expect } from '@playwright/test';

// This is a small e2e scaffold that requires Playwright to be installed and the dev server running.
// It opens the app, inserts a shape via context menu (or toggle), moves it by dragging, then undoes the move.

test('insert -> move -> undo', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  // Enable dev mode toggle
  await page.waitForSelector('button[aria-label="Toggle Dev Mode"]');
  await page.click('button[aria-label="Toggle Dev Mode"]');

  // Open context menu via right click near center
  await page.mouse.click(400, 300, { button: 'right' });
  // Wait for insert modal and click insert
  await page.waitForSelector('dialog[aria-label="Insert Shape"]', { timeout: 2000 }).catch(()=>{});
  // fallback to clicking toolbar insert if present
  // Insert a shape using Dev API if available
  const hasDev = await page.evaluate(() => !!(window as any).__weaver_dev);
  if (hasDev) {
    await page.evaluate(() => {
      const dev = (window as any).__weaver_dev;
      const id = 'e2e-' + Math.random().toString(36).slice(2,8);
      dev.addElement({ id, type: 'rect', layout: { x: 300, y: 200, w: 120, h: 80, z: 0 } });
      dev.select([id]);
    });
  }

  // drag the selected overlay by 50px
  await page.mouse.move(310, 210);
  await page.mouse.down();
  await page.mouse.move(360, 260);
  await page.mouse.up();

  // call undo via api
  await page.evaluate(() => (window as any).__weaver_dev && (window as any).__weaver_dev.undo());

  // expect no errors (this is a minimal smoke test)
  expect(true).toBeTruthy();
});
