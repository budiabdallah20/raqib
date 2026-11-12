/**
 * أدوات الـPasskey (WebAuthn) على السيرفر.
 *
 * الأمان:
 * - التحدي (challenge) يُصدر من السيرفر ويُخزن في كوكي httpOnly قصير العمر —
 *   لا يُقبل أي تحدي يأتي من العميل.
 * - التحقق يعيد فحص origin + rpID مرتين (توقيع + قرار العميل).
 * - عداد التوقيع (counter) يُراقب لكشف استنساخ المفتاح.
 * - كل العمليات خاضعة لحد معدل (rate limit) وسجل تدقيق (AuditLog).
 * - التسجيل يتطلب جلسة قائمة (لا بصمة لحساب غير موجود).
 */
import type { NextResponse } from 'next/server';

export const PASSKEY_RP_ID = process.env.PASSKEY_RP_ID ?? 'localhost';
export const PASSKEY_RP_NAME = 'RAQiB · رقيب';

export const PK_REG_CHALLENGE_COOKIE = 'pk_reg_chal';
export const PK_AUTH_CHALLENGE_COOKIE = 'pk_auth_chal';
const CHALLENGE_MAX_AGE = 180; // ثلاث دقائق تسمح ببطء نافذة البصمة على الموبايل

function secureCookies() {
  return (
    process.env.NODE_ENV === 'production' ||
    (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://')
  );
}

/**
 * origins المقبولة للتحقق: قائمة بيضاء صريحة فقط.
 * لا نثق بترويسة Origin القادمة من الطلب — المهاجم يستطيع إرسال أي قيمة.
 * في التطوير فقط نسمح بـlocalhost حتى تعمل البيئة المحلية.
 */
export function passkeyExpectedOrigins(request: Request): string[] {
  const origins = new Set<string>();

  const configured = (process.env.PASSKEY_ORIGIN || '').trim();
  if (configured) {
    try {
      origins.add(new URL(configured).origin);
    } catch {
      /* يُترك للتحقق من env */
    }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      /* تجاهل */
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const devOrigin = new URL(request.url).origin;
      const host = new URL(devOrigin).hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        origins.add(devOrigin);
      }
    } catch {
      /* تجاهل */
    }
  }

  if (origins.size === 0) {
    throw new Error('PASSKEY_ORIGIN or NEXT_PUBLIC_APP_URL must be configured');
  }
  return [...origins];
}

/** يثبت التحدي في كوكي httpOnly قصير العمر */
export function setChallengeCookie(response: NextResponse, name: string, challenge: string) {
  response.cookies.set({
    name,
    value: challenge,
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: CHALLENGE_MAX_AGE,
  });
}

/** يجيب التحدي من الكوكي — عنصر واحد لكل جلسة تسجيل/دخول */
export function getChallengeCookie(request: Request, name: string): string | null {
  const raw = request.headers.get('cookie') ?? '';
  const match = raw
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1).trim();
  return value.length > 0 ? decodeURIComponent(value) : null;
}

/** يبطل كوكي التحدي */
export function clearChallengeCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: 0,
  });
}
