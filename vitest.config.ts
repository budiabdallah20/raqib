import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    // اختبارات الوحدة فقط — e2e لها عَدّاء مستقل: npm run test:e2e (Playwright)
    include: ['tests/*.spec.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
