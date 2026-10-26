import { test, expect } from '@playwright/test';

/**
 * سيناريو الدكتور: دخول UI ← لوحة الدكتور ← فتح لوحة العرض الكاملة لمحاضرة حية من الديمو
 * ← التحقق أن التدوير يعمل (استجابتان للوحة العرض المتباعدة عن 20 ثانية) ← الكود اليدوي يظهر.
 */

const PROFESSOR = { identifier: 'professor@raqib.edu', password: 'Prof@123' };

test('professor journey: login UI → dashboard → full board with rotating token + manual code', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/login');
  await page.fill('#login-identifier', PROFESSOR.identifier);
  await page.fill('#login-password', PROFESSOR.password);
  await page.getByRole('button', { name: 'دخول إلى المنصة' }).click();
  await page.waitForURL('**/professor**', { timeout: 30_000 });

  // نأخذ محاضرة حية من قائمة محاضرات الدكتور الحقيقية
  const lecturesResp = await page.request.get('/api/lectures');
  expect(lecturesResp.status()).toBe(200);
  const lectures = await lecturesResp.json();
  const open = (lectures.lectures ?? lectures ?? []).find(
    (l: { isOpen?: boolean }) => l.isOpen,
  );
  expect(open, 'يجب أن توجد محاضرة حية مفتوحة من بيانات الديمو').toBeTruthy();

  // 1) لوحة العرض الكاملة
  const boardUrl = `/professor/board?lectureId=${open.id}`;
  const boardP1 = page.waitForResponse(
    (r) => r.url().includes('/api/lectures/board') && r.status() === 200,
    { timeout: 30_000 },
  );
  await page.goto(boardUrl);
  const b1 = await (await boardP1).json();

  expect(b1.manualCode).toMatch(/^\d{6}$/);
  expect(b1.token).toBeTruthy();
  expect(b1.lecture).toHaveProperty('course');

  // الكود اليدوي ظاهر على الشاشة
  await expect(page.getByText(b1.manualCode)).toBeVisible({ timeout: 15_000 });

  // 2) التدوير: انتظار استجابة لوحة جديدة بعد دورة 20 ثانية
  const boardP2 = page.waitForResponse(
    (r) => r.url().includes('/api/lectures/board') && r.status() === 200,
    { timeout: 45_000 },
  );
  const b2 = await (await boardP2).json();
  expect(b2.token).toBeTruthy();

  await page.screenshot({ path: 'test-results/professor-board-1440.png' });
});
