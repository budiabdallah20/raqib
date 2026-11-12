/**
 * تشفير البيانات الحساسة عند الراحة — AES-256-GCM.
 *
 * - مفتاح رئيسي من PII_ENCRYPTION_KEY (32 بايت base64url أو hex).
 * - اشتقاق مفتاح مستقل لكل حقل عبر HKDF (فصل نطاقات).
 * - IV عشوائي لكل كتابة في الحقول العادية.
 * - IV حتمي (HMAC) فقط للحقول الفريدة القابلة للبحث (email/phone/studentCode/nationalId)
 *   حتى تعمل استعلامات المساواة مع بقاء القيمة مشفرة. هذا يقبل تسريب "تساوي القيم"
 *   لكنه لا يكشف القيمة نفسها، وهو الحل القياسي للبحث فوق تشفير عند الراحة.
 * - AAD = اسم الحقل/السياق، لمنع نقل ciphertext من حقل إلى آخر.
 *
 * الصيغة: enc:v1:<context>:<iv>:<tag>:<ciphertext> (كله base64url)
 */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const PREFIX = 'enc:v1:';
const MASTER_SALT = Buffer.from('raqib-pii-v1', 'utf8');

let cachedMaster: Buffer | null = null;
let warnedDevFallback = false;

function parseMasterKey(raw: string): Buffer {
  const value = raw.trim().replace(/^["']|["']$/g, '');
  if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, 'hex');
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const key = Buffer.from(normalized, 'base64');
  if (key.length !== 32) {
    throw new Error('PII_ENCRYPTION_KEY must be exactly 32 bytes (base64url or 64 hex chars)');
  }
  return key;
}

function masterKey(): Buffer {
  if (cachedMaster) return cachedMaster;

  const configured = process.env.PII_ENCRYPTION_KEY?.trim();
  if (configured) {
    cachedMaster = parseMasterKey(configured);
    return cachedMaster;
  }

  // الإنتاج يفشل مغلقًا: لا تشغيل بلا مفتاح تشفير حقيقي.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PII_ENCRYPTION_KEY is required in production');
  }

  // تطوير فقط: اشتقاق مؤقت من JWT_SECRET حتى لا يتعطل الجهاز المحلي.
  const jwt = process.env.JWT_SECRET || '';
  if (jwt.length < 32) {
    throw new Error('PII_ENCRYPTION_KEY (or a strong JWT_SECRET in development) is required');
  }
  if (!warnedDevFallback) {
    warnedDevFallback = true;
    console.warn(
      '[raqib:security] PII_ENCRYPTION_KEY is missing — using a development-only key derived from JWT_SECRET. Set PII_ENCRYPTION_KEY before production.',
    );
  }
  cachedMaster = Buffer.from(
    hkdfSync('sha256', Buffer.from(jwt, 'utf8'), MASTER_SALT, 'raqib-pii-master', 32),
  );
  return cachedMaster;
}

function fieldKey(context: string): Buffer {
  return Buffer.from(
    hkdfSync('sha256', masterKey(), MASTER_SALT, `field:${context}`, 32),
  );
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * يشفّر نصًا. deterministic=true للحقول القابلة للبحث بالمساواة فقط.
 * القيم المشفرة مسبقًا تُعاد كما هي (idempotent).
 */
export function encryptSensitive(
  plaintext: string,
  context: string,
  deterministic = false,
): string {
  if (isEncrypted(plaintext)) return plaintext;

  const key = fieldKey(context);
  const iv = deterministic
    ? createHmac('sha256', key).update(`iv:${plaintext}`).digest().subarray(0, 12)
    : randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(context, 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${context}:${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

/** يفك تشفير قيمة أنتجها encryptSensitive. النص غير المشفر يُعاد كما هو (توافق قديم). */
export function decryptSensitive(value: string): string {
  if (!isEncrypted(value)) return value;

  const parts = value.slice(PREFIX.length).split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted value');

  const [context, ivB64, tagB64, ciphertextB64] = parts;
  const key = fieldKey(context);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAAD(Buffer.from(context, 'utf8'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** JSON مشفّر (للتفاصيل الحساسة مثل AuditLog.detail). */
export function encryptJson(value: unknown, context: string): string | null {
  if (value === undefined || value === null) return null;
  return encryptSensitive(JSON.stringify(value), context, false);
}

export function decryptJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decryptSensitive(value)) as T;
  } catch {
    return null;
  }
}

/**
 * بصمة HMAC غير قابلة للعكس لبيانات التعريف (IP مثلاً) — تسمح بالربط
 * دون تخزين القيمة الخام. الناتج ثابت لنفس القيمة ونفس المفتاح.
 */
export function hashPii(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = Buffer.from(
    hkdfSync('sha256', masterKey(), MASTER_SALT, 'hash:pii', 32),
  );
  const digest = createHmac('sha256', key).update(value).digest('hex');
  return `h1:${digest.slice(0, 32)}`;
}
