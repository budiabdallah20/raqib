import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'ar-EG' });

// 1) login
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('input[placeholder*="name@example.com"]', { timeout: 20000 });
const form = page.locator('form.space-y-4');
await form.locator('input[placeholder*="name@example.com"]').fill('student@raqib.edu');
await form.locator('input[type="password"]').fill('Student@123');
await form.locator('button[type="submit"]').click();
await page
  .waitForURL('**/student', { timeout: 30000, waitUntil: 'commit' })
  .catch(() => {});
await page.waitForSelector('text=محمد علي', { timeout: 20000 }).catch(() => {});
if (!page.url().includes('/student')) {
  await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/opencode/login-fail.png' });
  console.log('STUCK_URL', page.url());
  console.log('BODY', (await page.evaluate(() => document.body.innerText)).slice(0, 400));
}
check('login redirects to /student', page.url().includes('/student'));

// 2) dashboard renders (splash clears, content mounts)
await page.waitForSelector('text=محمد علي', { timeout: 20000 }).catch(() => {});
const bodyText = await page.evaluate(() => document.body.innerText);
check('dashboard content visible', bodyText.length > 300, `len=${bodyText.length}`);
check('profile card (name/code)', bodyText.includes('2024001'));
check('GPA radial section', bodyText.includes('تراكمي'));
check('upcoming lecture block', bodyText.includes('المحاضرة القادمة') || bodyText.includes('لا توجد'));
check('course matrix title', bodyText.includes('تحليلات المواد'));
const codes = ['MAT207', 'COM201', 'MAT201', 'MAT203', 'MAT213', 'MAT305', 'MAT211'];
const present = codes.filter((c) => bodyText.includes(c));
check('7 official courses listed', present.length === 7, `found=${present.length}`);

// 5) zones represented
const green = bodyText.includes('ممتاز') || bodyText.includes('آمن');
const yellow = bodyText.includes('يحتاج تحسين') || bodyText.includes('ركز');
const red = bodyText.includes('في خطر') || bodyText.includes('خطر');
check('zone chips render', green && yellow, `green=${green} yellow=${yellow} red=${red}`);

// 6) GPA entry modal
const gpaBtn = page.locator('button', { hasText: /سجل|أدخل|المعدل السابق/ }).first();
if (await gpaBtn.count()) {
  await gpaBtn.click();
  await page.waitForSelector('[role="dialog"], [data-modal]', { timeout: 8000 }).catch(() => {});
  const modalVisible = await page.evaluate(() => !!document.querySelector('[role="dialog"], [data-modal]'));
  check('GPA entry modal opens', modalVisible);
  if (modalVisible) {
    await page.fill('input[type="number"]', '3.05');
    await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/opencode/home-gpa-modal.png' });
    await page.keyboard.press('Escape').catch(() => {});
  }
}

// 7) screenshot full dashboard
await page.screenshot({ path: 'C:/Users/Administrator/AppData/Local/Temp/opencode/home-dashboard.png', fullPage: true });
console.log('SCREENSHOT saved: home-dashboard.png');
console.log('SUMMARY', JSON.stringify({ pass: results.filter((r) => r.pass).length, total: results.length }));
await page.evaluate((t) => navigator.clipboard.writeText(t).catch(() => {}), bodyText);
console.log('===BODY===');
console.log(bodyText);
await browser.close();
process.exit(results.every((r) => r.pass) ? 0 : 1);
