import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3010/', { waitUntil: 'domcontentloaded' });

await page.evaluate(() => {
  window.__lcps = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const el = e.element ? e.element.tagName + '.' + (e.element.className || '').toString().slice(0, 80) : '(none)';
      const txt = e.element && e.element.textContent ? e.element.textContent.trim().slice(0, 40) : '';
      window.__lcps.push({ t: Math.round(e.startTime), size: Math.round(e.size), el, txt });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});

await page.waitForTimeout(6000);
const lcps = await page.evaluate(() => window.__lcps);
console.log(JSON.stringify(lcps, null, 1));
await browser.close();
