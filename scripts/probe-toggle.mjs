import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3010', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
  const els = [...document.querySelectorAll('[aria-label="اللغة"]')];
  return {
    count: els.length,
    each: els.slice(0, 3).map((e) => ({
      tag: e.tagName,
      cls: e.className.slice(0, 180),
      bg: getComputedStyle(e).backgroundColor,
      parentCls: (e.parentElement && e.parentElement.className || '').slice(0, 120),
    })),
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
