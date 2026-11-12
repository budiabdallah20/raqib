/**
 * بيئة اختبار حتمية: أسرار وهمية صالحة الطول فقط.
 * لا تُستخدم هذه القيم في الإنتاج مطلقًا.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-jwt-secret-not-for-production-0123456789';

process.env.PII_ENCRYPTION_KEY =
  process.env.PII_ENCRYPTION_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
