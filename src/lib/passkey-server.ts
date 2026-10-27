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
const CHALLENGE_MAX_AGE = 120; // ثانيتان كافيتان لإتمام اللمسة

/** origins المقبولة للتحقق: ترويسة Origin الحالية + أي origin معرف بالبيئة */
export function passkeyExpectedOrigins(request: Request): string[] {
  const origins = new Set<string>();
  const headerOrigin = request.headers.get('origin');
  if (headerOrigin) origins.add(headerOrigin.split(',')[0].trim());
  try {
    origins.add(new URL(request.url).origin);
  } catch {
    /* تجاهل */
  }
  const envOrigin = process.env.PASSKEY_ORIGIN;
  if (envOrigin) origins.add(envOrigin.trim());
  return [...origins];
}

/** يثبت التحدي في كوكي httpOnly قصير العمر */
export function setChallengeCookie(response: NextResponse, name: string, challenge: string) {
  response.cookies.set({
    name,
    value: challenge,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
