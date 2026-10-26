/**
 * فحص متغيرات البيئة الحساسة.
 * في الإنتاج: أي إعداد ناقص/ضعيف يمنع تشغيل السيرفر بدل ما يشتغل بأمان وهمي.
 */
const WEAK_SECRETS = new Set([
  'raqib-super-secret-key-change-me-min-32-chars-long',
  'change-me-to-a-random-string-min-32-chars',
  'changeme',
  'secret',
]);

export function validateEnv() {
  const problems: string[] = [];
  const isProd = process.env.NODE_ENV === 'production';

  const jwt = process.env.JWT_SECRET || '';
  if (jwt.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters');
  }
  if (isProd && WEAK_SECRETS.has(jwt)) {
    problems.push('JWT_SECRET is still a placeholder — run `npm run security:env`');
  }

  if (isProd && !process.env.ADMIN_ACCESS_CODE_HASH) {
    problems.push('ADMIN_ACCESS_CODE_HASH is required in production');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (isProd && !appUrl.startsWith('https://')) {
    problems.push('NEXT_PUBLIC_APP_URL must use https:// in production');
  }

  if (isProd && process.env.ALLOW_DEMO_RESET === '1') {
    console.warn(
      '[raqib:security] ALLOW_DEMO_RESET=1 in production — demo reset can wipe data. Disable it unless this is a demo deployment.',
    );
  }

  return problems;
}

export function assertEnv() {
  const problems = validateEnv();
  if (!problems.length) return;
  const message = `[raqib:security] Invalid environment:\n- ${problems.join('\n- ')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(message);
}
