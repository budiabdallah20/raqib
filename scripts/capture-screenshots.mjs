/**
 * Capture README screenshots from a running dev server.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 *   DOCS_BASE_URL=http://localhost:3002 node scripts/capture-screenshots.mjs
 *
 * Requires Playwright (`npx playwright install chromium`).
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.DOCS_BASE_URL || 'http://localhost:3000';
const OUT = path.resolve('docs/screenshots');

const hideDevChrome = async (page) => {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {});
  await page.waitForTimeout(1200);
};

const shot = async (page, name) => {
  await hideDevChrome(page);
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 82 });
  console.log('saved', name);
};

const goto = async (page, url) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await goto(page, url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
      await page.waitForTimeout(1200);
    }
  }
};

const login = async (page, identifier, password, waitFor) => {
  await goto(page, `${BASE}/login`);
  await page.waitForSelector('form.space-y-4', { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.fill('#login-identifier', identifier);
  await page.fill('form.space-y-4 input[type="password"]', password);
  await page.click('form.space-y-4 button[type="submit"]');
  await page.waitForURL(waitFor, { waitUntil: 'commit', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4000);
  if (!waitFor.test(page.url())) {
    console.log('login did not reach', waitFor, 'url=', page.url());
    console.log((await page.locator('body').innerText()).slice(0, 400));
  }
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar-EG' });
const page = await context.newPage();

// Landing + login
await goto(page, BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(4500);
await shot(page, 'landing.jpg');

await goto(page, `${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(2500);
await shot(page, 'login.jpg');

// Student
await login(page, 'student@raqib.edu', 'Student@123', /\/student/);
await goto(page, `${BASE}/student`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(5000);
await shot(page, 'student-dashboard.jpg');

// Professor + board
await context.clearCookies();
await login(page, 'professor@raqib.edu', 'Prof@123', /\/professor/);
await goto(page, `${BASE}/professor`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(4500);
await shot(page, 'professor-dashboard.jpg');

const lectures = await page.evaluate(async () => {
  const r = await fetch('/api/lectures', { credentials: 'include' });
  return r.ok ? r.json() : { error: r.status };
});
const list = Array.isArray(lectures) ? lectures : lectures.lectures || lectures.data || [];
const open = list.find((l) => l.isOpen) || list[0];
if (open?.id) {
  if (!open.isOpen) {
    await page.evaluate(async (id) => {
      await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'toggle', id }),
      });
    }, open.id);
  }
  await goto(page, `${BASE}/professor/board?lectureId=${open.id}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(4000);
  await shot(page, 'attendance-board.jpg');
} else {
  console.log('no lecture found for board screenshot');
}

// Admin
await context.clearCookies();
await login(page, 'admin@raqib.edu', 'Admin@123', /\/admin/);
await goto(page, `${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(4500);
await shot(page, 'admin-dashboard.jpg');

await browser.close();
console.log('done');
