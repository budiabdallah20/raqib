/**
 * فحص متغيرات البيئة الحساسة.
 * في الإنتاج: أي إعداد ناقص/ضعيف يمنع تشغيل السيرفر بدل ما يشتغل بأمان وهمي.
 */
const WEAK_SECRETS = new Set([
  'raqib-super-secret-key-change-me-min-32-chars-long',
  'change-me-to-a-random-string-min-32-chars',
  'change-me-to-a-64-char-random-string',
  'changeme',
  'secret',
]);

function looksLikeWeakKey(value: string) {
  return (
    WEAK_SECRETS.has(value) ||
    /change-me|super-secret|replace|example|secret-key|your-key/i.test(value)
  );
}

function isValidPiiKey(value: string) {
  const raw = value.trim().replace(/^["']|["']$/g, '');
  if (/^[0-9a-f]{64}$/i.test(raw)) return true;
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(normalized, 'base64').length === 32;
  } catch {
    return false;
  }
}

export function validateEnv() {
  const problems: string[] = [];
  const isProd = process.env.NODE_ENV === 'production';

  const jwt = process.env.JWT_SECRET || '';
  if (jwt.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters');
  }
  if (looksLikeWeakKey(jwt)) {
    problems.push('JWT_SECRET is still a placeholder — run `npm run security:env`');
  }

  const piiKey = process.env.PII_ENCRYPTION_KEY || '';
  if (isProd && !piiKey) {
    problems.push('PII_ENCRYPTION_KEY is required in production (AES-256-GCM at rest)');
  } else if (piiKey && !isValidPiiKey(piiKey)) {
    problems.push('PII_ENCRYPTION_KEY must be exactly 32 bytes (base64url or 64 hex chars)');
  } else if (piiKey && looksLikeWeakKey(piiKey)) {
    problems.push('PII_ENCRYPTION_KEY is still a placeholder');
  }

  if (isProd && !process.env.ADMIN_ACCESS_CODE_HASH) {
    problems.push('ADMIN_ACCESS_CODE_HASH is required in production');
  }
  // كود إدارة صريح في البيئة = سر قابل للقراءة من أي عملية/لقطة بيئة.
  if (isProd && process.env.ADMIN_ACCESS_CODE) {
    problems.push(
      'ADMIN_ACCESS_CODE must not be set in production — use ADMIN_ACCESS_CODE_HASH only',
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (isProd && !appUrl.startsWith('https://')) {
    problems.push('NEXT_PUBLIC_APP_URL must use https:// in production');
  }

  const passkeyOrigin = process.env.PASSKEY_ORIGIN || '';
  if (passkeyOrigin) {
    try {
      const parsed = new URL(passkeyOrigin);
      if (isProd && parsed.protocol !== 'https:') {
        problems.push('PASSKEY_ORIGIN must use https:// in production');
      }
    } catch {
      problems.push('PASSKEY_ORIGIN must be a valid absolute origin');
    }
  }

  if (isProd && process.env.SHOW_DEV_RESET_CODE === '1') {
    problems.push('SHOW_DEV_RESET_CODE=1 must not be used in production');
  }

  // Behind a reverse proxy (Vercel/Nginx/Cloudflare) the client IP must be trusted,
  // otherwise the per-IP rate limiter collapses to a single 'unknown' bucket.
  if (isProd && process.env.TRUST_PROXY !== '1') {
    problems.push(
      'TRUST_PROXY must be "1" in production behind a trusted reverse proxy (per-IP rate limiting requires it)',
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
