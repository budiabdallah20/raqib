import { isIP } from 'node:net';
import { prisma } from './db';
import { hashPii } from './crypto';

/**
 * نافذة منزلقة حقيقية: نخزّن أوقات المحاولات ونستبعد ما خرج من النافذة.
 * هذا يمنع «انفجار الحدّ» عند حدود النوافذ الثابتة (fixed-window burst).
 */
type Bucket = { hits: number[]; windowMs: number };
const attempts = new Map<string, Bucket>();
let lastSweep = 0;

/** تنظيف دوري يمنع تسريب الذاكرة من مفاتيح لا نهائية */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of attempts) {
    const cutoff = now - bucket.windowMs;
    while (bucket.hits.length && bucket.hits[0] <= cutoff) bucket.hits.shift();
    if (bucket.hits.length === 0) attempts.delete(key);
  }
  // حماية قصوى من تضخم الذاكرة في حال هجوم بمفاتيح عشوائية
  if (attempts.size > 50_000) {
    const overflow = attempts.size - 40_000;
    let removed = 0;
    for (const key of attempts.keys()) {
      attempts.delete(key);
      if (++removed >= overflow) break;
    }
  }
}

export function clientKey(ip: string | null, email?: string) {
  return `${ip || 'unknown'}:${(email || '').toLowerCase()}`;
}

/**
 * لا نثق بأي هيدر إلا لو السيرفر خلف reverse proxy موثوق.
 * TRUST_PROXY=1 في الإنتاج خلف Nginx/Cloudflare.
 */
export function getClientIp(request: Request) {
  // بلا TRUST_PROXY=1: أي هيدر IP ممكن يزوّره العميل نفسه — نتجاهله كلياً (fail-safe)
  const trusted = process.env.TRUST_PROXY === '1';
  if (!trusted) return null;
  // آخر مدخل في XFF هو اللي سجّله آخر بروكسي موثوق قبلنا — الأصعب على التلاعب
  const forwarded = request.headers.get('x-forwarded-for');
  const candidate = forwarded?.split(',').pop()?.trim();
  if (!candidate) return null;
  return isIP(candidate) ? candidate : null;
}

export function assertRateLimit(
  key: string,
  limit = 8,
  windowMs = 15 * 60 * 1000,
  message = 'محاولات كثيرة جدًا. انتظر قليلًا ثم حاول مرة أخرى',
) {
  const now = Date.now();
  sweep(now);

  let bucket = attempts.get(key);
  if (!bucket) {
    bucket = { hits: [], windowMs };
    attempts.set(key, bucket);
  }
  bucket.windowMs = Math.max(bucket.windowMs, windowMs);

  const cutoff = now - bucket.windowMs;
  while (bucket.hits.length && bucket.hits[0] <= cutoff) bucket.hits.shift();

  if (bucket.hits.length >= limit) {
    // أقدم محاولة يجب أن تخرج من النافذة قبل السماح بمحاولة جديدة
    const blocking = bucket.hits[bucket.hits.length - limit] ?? bucket.hits[0];
    const err = new Error(message) as Error & {
      status: number;
      retryAfter: number;
    };
    err.status = 429;
    err.retryAfter = Math.max(
      1,
      Math.ceil((blocking + bucket.windowMs - now) / 1000),
    );
    throw err;
  }

  bucket.hits.push(now);
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}

export function sanitizeString(value: string, max = 200) {
  return value
    .replace(/[<>]/g, '')
    // إزالة محارف التحكم غير المرئية (Zero-width / bidi override)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .trim()
    .slice(0, max);
}

export function normalizePhone(value: string) {
  return value.replace(/[\s\-()]/g, '');
}

/** نص خطأ آمن للسجلات: بلا PII، وبلا كائنات Prisma الخام. */
function safeErrorText(error: unknown) {
  if (error instanceof Error) {
    const stack = typeof error.stack === 'string' ? error.stack : '';
    return redactText(`${error.name}: ${error.message}\n${stack}`).slice(0, 4_000);
  }
  return redactText(String(error)).slice(0, 1_000);
}

/** يسجل الخطأ في السيرفر فقط، ولا يسرّب تفاصيل Prisma/قاعدة البيانات للعميل */
export function jsonError(message: string, status = 400, code?: string) {
  const safeMessage =
    status === 500 ? 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا' : message;
  if (status >= 500) {
    console.error('[raqib:api:error]', status, safeErrorText(message));
  }
  return Response.json(
    code ? { error: safeMessage, code } : { error: safeMessage },
    {
      status,
      headers: { 'cache-control': 'no-store' },
    },
  );
}

/** غلاف موحّد لأخطاء الـ API */
export function handleApiError(
  error: unknown,
  fallback = 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا',
) {
  const err = error as Error & { status?: number; retryAfter?: number };
  const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) {
    console.error('[raqib:api:unhandled]', safeErrorText(error));
    return jsonError(fallback, 500);
  }
  const res = jsonError(err.message || fallback, status);
  if (status === 429 && err.retryAfter) {
    res.headers.set('retry-after', String(err.retryAfter));
  }
  return res;
}

/** حماية CSV من حقن الصيغ في Excel (CSV Injection) */
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

// ── سجل التدقيق: كل عملية حساسة بتتكتب هنا (مين / إيه / إمتى / منين) ──
type AuditInit = {
  user?: { id: string; role?: string } | null;
  request?: Request;
  action: string;
  entity: string;
  detail?: unknown;
};

const SENSITIVE_KEY_RE =
  /(email|phone|mobile|identifier|national|studentcode|password|passwd|token|secret|authorization|cookie|otp|resetcode|code)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function redactText(value: string) {
  return value.replace(EMAIL_RE, '[redacted-email]').slice(0, 2_000);
}

/** إزالة PII/الأسرار من تفاصيل التدقيق قبل تخزينها — حتى لا يتحول السجل نفسه لتسريب. */
export function redactDetail(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactText(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => redactDetail(item, depth + 1));
  if (typeof value !== 'object') return '[unserializable]';

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      result[key] = '[redacted]';
    } else if (key.toLowerCase() === 'ip') {
      result[key] = hashPii(typeof child === 'string' ? child : null);
    } else {
      result[key] = redactDetail(child, depth + 1);
    }
  }
  return result;
}

export async function logAudit({ user, request, action, entity, detail }: AuditInit) {
  try {
    const ip = request ? getClientIp(request) : null;
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userRole: user?.role ?? null,
        action,
        entity,
        detail: detail === undefined ? null : safeStringify(redactDetail(detail)),
        // IP مخزّن كبصمة HMAC — لا عنوان خام في سجل التدقيق.
        ip: hashPii(ip),
        userAgent: request?.headers.get('user-agent')?.slice(0, 256) ?? null,
      },
    });
  } catch {
    // تسجيل الأحداث لا يجب أن يفشل الطلب أبدًا
  }
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value).slice(0, 8_000);
  } catch {
    return String(value).slice(0, 8_000);
  }
}
