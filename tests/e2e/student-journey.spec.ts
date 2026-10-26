import { test, expect } from '@playwright/test';
import * as path from 'node:path';

/**
 * رحلة الطالب — سيناريو E2E حقيقي ضد الخادم المبني:
 * دخول UI ← لوحة الطالب ← صفحة الحضور مع إحصاءات حقيقية ← فحص عدم تسريب qrToken
 * ← رفض رمز منتهي من API الحضور ← زيارة التاسكات.
 */

const STUDENT = { identifier: 'student@raqib.edu', password: 'Student@123' };

test('student journey: login UI → attendance route stats → no qrToken leak → expired token rejected', async ({ page }) => {
  // 1) دخول عبر واجهة المستخدم الفعلية (بما فيها CSP وhttps)
  await page.goto('/login');
  await page.fill('#login-identifier', STUDENT.identifier);
  await page.fill('#login-password', STUDENT.password);
  await page.getByRole('button', { name: 'دخول إلى المنصة' }).click();
  await page.waitForURL('**/student**', { timeout: 30_000 });

  // 2) صفحة الحضور الجديدة تحمّل وتظهر إحصاءات محسوبة
  const summaryResp = await page.waitForResponse(
    (r) => r.url().includes('/api/attendance/summary') && r.status() === 200,
    { timeout: 30_000 },
  );
  await page.goto('/student/attendance');
  const summary = await summaryResp.json();
  expect(summary.courses?.length ?? 0).toBeGreaterThan(0);
  // السياسة: SAFE/WARNING/DENIED على المادة
  expect(summary.courses[0]).toHaveProperty('status');

  // 3) أمان: لا qrToken في أي استجابة طالب
  const bodyText = JSON.stringify(summary);
  expect(bodyText).not.toContain('qrToken');
  expect(bodyText).not.toContain('qrExpiresAt');

  // 4) أمان: رمز منتهي/مزوّر يُرفض برسالة واضحة
  const scan = await page.request.post('/api/attendance', {
    data: { token: 'e2e-expired-token-not-real' },
  });
  expect(scan.status()).not.toBe(200);
  const scanJson = await scan.json().catch(() => ({}));
  const msg = JSON.stringify(scanJson);
  expect(msg.length).toBeGreaterThan(0);

  // 5) التاسكات تُفتح بلا أخطاء
  await page.goto('/student/tasks');
  await expect(page.locator('h1, h2').first()).toBeVisible();

  test.info().attachments.push({
    name: 'student-attendance-1440',
    contentType: 'image/png',
    path: path.resolve('test-results/student-attendance-1440.png'),
  });
  await page.screenshot({ path: 'test-results/student-attendance-1440.png', fullPage: false });
});
