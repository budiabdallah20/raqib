import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3010', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
const info = await p.evaluate(() => ({
  labels: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).slice(0, 24),
  hasStatusRole: document.querySelectorAll('[role="status"]').length,
  roleAttrs: [...document.querySelectorAll('[role]')].map((e) => e.getAttribute('role')).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12),
  bodyLen: document.body.innerHTML.length,
  headerFound: !!document.querySelector('header'),
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
