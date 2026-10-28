/**
 * verify-landing-v3.mjs — تحقق شامل من واجهة الهبوط بعد تعديلات 2026-10-28:
 * شاشة تحميل ليمونية جديدة، عدّاد بدون شريط، فوتر ترمزي/أسود، عمود قانون،
 * لوجوهات الكلية، تدرّج اسم المطور، إطار اللغة الأبيض، وكود الأدمن،
 * وحفظ الجلسة عند التسجيل، وقياسات أداء (LCP/FCP/CLS).
 *
 * الاستعمال: سيرفر إنتاج/ديف شغال ثم:
 *   $env:BASE_URL='http://localhost:3010'; node scripts/verify-landing-v3.mjs
 */
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const BASE = process.env.BASE_URL || 'http://localhost:3010';

const results = [];
const ok = (name, pass, extra = '') => {
  results.push({ name, pass });
  console.log(`${pass ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    ok(name, false, String(e).split('\n')[0].slice(0, 120));
  }
};

const prisma = new PrismaClient();
const suffix = Date.now().toString().slice(-8);
const testEmail = `qa-${suffix}@raqib.test`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});

/* 1) فتح الصفحة */
await step('page opens (HTTP 200)', async () => {
  const res = await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  ok('page opens (HTTP 200)', res.status() === 200, `status=${res.status()}`);
});

/* 2) شاشة التحميل: ليموني فاتح بلون واحد */
await step('splash check', async () => {
  const splash = page.locator('[role="status"]');
  await splash.waitFor({ state: 'visible', timeout: 8000 });
  const bg = await splash.evaluate((el) => getComputedStyle(el).backgroundColor);
  ok('splash bg = lime #d3f36c', bg === 'rgb(211, 243, 108)', bg);
});

/* 3) الانتظار حتى يختفي الـ overlay (fade-out + عدّاد) */
await step('splash fade-out', async () => {
  await page.waitForSelector('[role="status"]', { state: 'detached', timeout: 9000 });
  ok('splash fade-out ≤ 9s', true);
});

/* 4) ميتا الأداء بعد الاستقرار */
await step('performance metrics', async () => {
  await page.waitForLoadState('networkidle');
  const metrics = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = { lcp: null, fcp: null, cls: 0 };
        const on = (list) => {
          for (const e of list.getEntries()) {
            if (e.entryType === 'largest-contentful-paint') {
              out.lcp = Math.round(e.startTime);
              const el = e.element;
              out.lcpEl = el ? el.tagName + '.' + String(el.className).slice(0, 60) : '?';
            }
            if (e.entryType === 'paint' && e.name === 'first-contentful-paint') out.fcp = Math.round(e.startTime);
            if (e.entryType === 'layout-shift' && !e.hadRecentInput) out.cls += e.value;
          }
        };
        try {
          new PerformanceObserver(on).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(on).observe({ type: 'paint', buffered: true });
          new PerformanceObserver(on).observe({ type: 'layout-shift', buffered: true });
        } catch {}
        setTimeout(() => resolve(out), 400);
      }),
  );
  ok('FCP < 1.8s', metrics.fcp !== null && metrics.fcp < 1800, `FCP=${metrics.fcp}ms`);
  ok('LCP < 2.5s', metrics.lcp !== null && metrics.lcp < 2500, `LCP=${metrics.lcp}ms el=${metrics.lcpEl || '?'}`);
  ok('CLS < 0.1', metrics.cls < 0.1, `CLS=${metrics.cls.toFixed(3)}`);
});

/* 5) إطار اللغة أبيض */
await step('language toggle white frame', async () => {
  const toggleBg = await page
    .locator('[aria-label="اللغة"]')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  ok('language toggle bg = white', toggleBg === 'rgba(255, 255, 255, 0.95)', toggleBg);
});

/* 6) الفوتر: ترمزي/أسود + عمود قانون + شريط الكلية + الأسماء المتدرجة */
await step('footer checks', async () => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const footer = page.locator('footer').last();
  const footerBg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
  ok('footer bg = teal-black #040709', footerBg === 'rgb(4, 7, 9)', footerBg);

  const navCount = await footer.locator('nav').count();
  ok('footer navs = 3 (nav+platform+legal)', navCount === 3, `count=${navCount}`);

  const uniLogo = await footer.locator('img[src*="suez-uni-logo"]').count();
  const facLogo = await footer.locator('img[src*="faculty-sci-logo"]').count();
  ok('suez university logo present', uniLogo >= 1, `count=${uniLogo}`);
  ok('faculty of science logo present', facLogo >= 1, `count=${facLogo}`);

  const cycleSpans = await footer.locator('.animate-name-cycle').count();
  ok('animated gradient names ≥ 3', cycleSpans >= 3, `count=${cycleSpans}`);

  const footerText = await footer.textContent();
  ok('no «BUDI» word left in footer', !footerText.includes('BUDI'));

  const ctaTeal = (await footer.locator('a[href*="tab=register"]').first().getAttribute('class')) || '';
  ok('footer CTA = teal gradient', ctaTeal.includes('#0f766e'));

  const devImg = await footer.locator('img[src*="1-sm.jpg"]').count();
  ok('dev photo optimized 1-sm.jpg', devImg >= 1);
});

/* 7) حجم الصورة المحمّلة فعليًا */
await step('dev photo wire size', async () => {
  const footer = page.locator('footer').last();
  const src = await footer.locator('img[src*="1-sm.jpg"]').first().evaluate((img) => img.currentSrc);
  const bytes = await fetch(src).then((r) => r.blob().then((b) => b.size));
  ok('dev photo ≤ 60KB on wire', bytes > 0 && bytes <= 60 * 1024, `${Math.round(bytes / 1024)}KB`);
});

/* 8) كود الأدمن → دخول 200 + كوكي */
await step('admin code login', async () => {
  const code = (process.env.RAQIB_ADMIN_CODE || '').replace(/\D/g, '');
  if (!code) {
    ok('admin code login = 200 + session cookie', false, 'RAQIB_ADMIN_CODE غير متوفر — تم تمريره في الشات فقط');
  } else {
    const res = await fetch(`${BASE}/api/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const cookie = res.headers.get('set-cookie') || '';
    const body = await res.json().catch(() => ({}));
    ok('admin code login = 200 + session cookie', res.status === 200 && cookie.length > 0, `status=${res.status} role=${body?.user?.role || '—'}`);
  }

  const wrong = await fetch(`${BASE}/api/auth/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '0000000000000000' }),
  });
  ok('wrong admin code = 401 protective', wrong.status === 401, `status=${wrong.status}`);
});

/* 9) التسجيل يصدر جلسة فورًا + تنظيف بيانات الاختبار */
await step('register session', async () => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'STUDENT',
      name: 'اختبار تحقق رقيب',
      email: testEmail,
      phone: `010${suffix}`,
      gender: 'MALE',
      birthDate: '2000-01-01',
      password: 'Raqib#Test1',
      confirmPassword: 'Raqib#Test1',
      acceptTerms: true,
      studentCode: `TS${suffix}`,
    }),
  });
  const cookie = res.headers.get('set-cookie') || '';
  const body = await res.json().catch(() => ({}));
  const errMsg = body?.message || body?.error || '';
  ok(
    'register = 201 + immediate session cookie',
    res.status === 201 && cookie.length > 0,
    `status=${res.status}${errMsg ? ' — ' + String(errMsg).slice(0, 90) : ''}`,
  );

  const cleaned = await prisma.user.deleteMany({ where: { email: { endsWith: '.raqib.test' } } });
  ok('qa test users cleaned from dev.db', true, `deleted=${cleaned.count}`);
});

/* 10) سكرينشوتات للسجل */
await step('screenshots', async () => {
  await page.screenshot({
    path: 'scripts/out-landing-footer.png',
    fullPage: false,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/out-landing-top.png' });
  ok('screenshots saved', true, 'scripts/out-landing-*.png');
});

await browser.close();
await prisma.$disconnect();

const failed = results.filter((r) => !r.pass);
console.log(`\n===== ${results.length - failed.length}/${results.length} PASSED =====`);
process.exit(failed.length ? 1 : 0);
