const { chromium } = require('playwright');
const http = require('http');

function waitForServer(url, timeoutMs = 30000, interval = 500) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.request(url, { method: 'HEAD', timeout: 2000 }, (res) => {
        // any response means the server is up
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for server at ' + url));
        setTimeout(check, interval);
      });
      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for server at ' + url));
        setTimeout(check, interval);
      });
      req.end();
    };
    check();
  });
}

(async () => {
  let browser;
  try {
+    console.log('Waiting for dev server at http://127.0.0.1:5173/ ...');
    await waitForServer('http://127.0.0.1:5173/');
    console.log('Server reachable, launching browser');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/');
    await page.screenshot({ path: 'before.png', fullPage: true });
    // Use a locator so Playwright will retry and handle re-attached elements.
    const toggle = page.locator('button[aria-label="Toggle Dev Mode"]');
    try {
      await toggle.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      console.log('Toggle selector not visible after wait');
      process.exit(2);
    }

    // Click with a small retry if the element is detached during the action.
    async function safeClick(loc) {
      try {
          await loc.click({ timeout: 10000 });
          return;
        } catch (err) {
          // attempt scroll into view and retry once
          try {
            await loc.scrollIntoViewIfNeeded();
          } catch (e) {}
          await page.waitForTimeout(500);
          try { await loc.click({ timeout: 5000 }); return; } catch (e) {}
          // final fallback: click via DOM to avoid Playwright stability issues
          try {
            const ok = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return false;
              el.click();
              return true;
            }, 'button[aria-label="Toggle Dev Mode"]');
            if (ok) return;
          } catch (e) {}
          // if we reach here, rethrow original error to be handled by caller
          throw err;
        }
    }

    await safeClick(toggle);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'after-on.png', fullPage: true });
    await safeClick(toggle);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'after-off.png', fullPage: true });
    console.log('Screenshots saved: before.png, after-on.png, after-off.png');
  } catch (err) {
    console.error('error', err);
    try {
      if (browser) {
        const pages = await browser.contexts()[0]?.pages() || [];
        const page = pages[0];
        if (page) {
          try { await page.screenshot({ path: 'debug-failure.png', fullPage: true }); } catch (e) {}
          try { const html = await page.content(); require('fs').writeFileSync('page-debug.html', html, 'utf8'); } catch (e) {}
        }
      }
    } catch (e) {}
    process.exitCode = 1;
  } finally {
    if (browser) try { await browser.close(); } catch (e) {}
  }
})();
