import { defineConfig, devices } from '@playwright/test';

/**
 * اختبارات E2E لمنصة رقيب — التشغيل: npm run test:e2e
 * تشترط خادم HTTPS يعمل على localhost:5000 (`npm run dev:https` أو npm start).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    // شهادة mkcert محلية ذاتية التوقيع
    ignoreHTTPSErrors: true,
    baseURL: process.env.E2E_BASE_URL ?? 'https://localhost:5000',
    locale: 'ar-EG',
    permissions: ['camera'],
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }, // 390px RTL
  ],
});
