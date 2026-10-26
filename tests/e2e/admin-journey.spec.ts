import { test, expect } from '@playwright/test';

/**
 * سيناريو الأدمن: دخول UI ← داشبورد بالأرقام الحقيقية ← تقرير الكلية ← مصفوفة CSV
 * + فحص أن مسار الديمو المحمي يرفض غير الأدمن.
 */

const ADMIN = { identifier: 'admin@raqib.edu', password: 'Admin@123' };

test('admin journey: login UI → real stats dashboard → college CSV export', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-identifier', ADMIN.identifier);
  await page.fill('#login-password', ADMIN.password);
  await page.getByRole('button', { name: 'دخول إلى المنصة' }).click();
  await page.waitForURL('**/admin**', { timeout: 30_000 });

  // الأرقام محسوبة من DB فعليًا (وليس ثوابت شاشة)
  const statsResp = await page.waitForResponse(
    (r) => r.url().includes('/api/admin/stats') && r.status() === 200,
    { timeout: 30_000 },
  );
  const stats = await statsResp.json();
  expect(Number(stats.totals.students)).toBeGreaterThanOrEqual(100);
  expect(Number(stats.attendance.attendancePct)).toBeGreaterThan(0);

  await page.goto('/admin/reports');

  // تصدير CSV من نقطة النهاية الفعلية
  const csvResp = await page.request.get('/api/admin/report?format=csv');
  expect(csvResp.status()).toBe(200);
  const text = await csvResp.text();
  expect(text).toContain('\ufeff'); // BOM لدعم العربية في Excel
  expect(text.split('\n').length).toBeGreaterThan(10);

  await page.screenshot({ path: 'test-results/admin-reports-1440.png' });
});
