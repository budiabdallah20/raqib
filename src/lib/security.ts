import { isIP } from 'node:net';
import { prisma } from './db';

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();
let lastSweep = 0;

/** تنظيف دوري يمنع تسريب الذاكرة من مفاتيح لا نهائية */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt < now) attempts.delete(key);
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
  const trusted = process.env.TRUST_PROXY === '1';
  const forwarded = trusted ? request.headers.get('x-forwarded-for') : null;
  const candidate = forwarded
    ? forwarded.split(',')[0]?.trim()
    : request.headers.get('x-real-ip')?.trim();
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
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    const err = new Error(message) as Error & {
      status: number;
      retryAfter: number;
    };
    err.status = 429;
    err.retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw err;
  }
  current.count += 1;
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

/** يسجل الخطأ كاملًا في السيرفر، ولا يسرّب تفاصيل Prisma/قاعدة البيانات للعميل */
export function jsonError(message: string, status = 400, code?: string) {
  const safeMessage =
    status === 500 ? 'حدث خطأ غير متوقع، حاول مرة أخرى لاحقًا' : message;
  if (status >= 500) {
    console.error('[raqib:api:error]', status, String(message).slice(0, 800));
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
    console.error('[raqib:api:unhandled]', error);
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

export async function logAudit({ user, request, action, entity, detail }: AuditInit) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userRole: user?.role ?? null,
        action,
        entity,
        detail: detail === undefined ? null : safeStringify(detail),
        ip: request ? getClientIp(request) : null,
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
