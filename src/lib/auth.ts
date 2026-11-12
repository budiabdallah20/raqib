import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { COOKIE_NAME, SESSION_REMEMBER_IN, SESSION_SHORT_IN } from './constants';
import { getCurrentSession, revokeCurrentSession } from './session';
import { logAudit } from './security';
import type { AuthUser, Role } from '@/types';

export { signToken, verifyToken } from './jwt';
export { issueSession, revokeAllSessions } from './session';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function applyAuthCookie(
  response: NextResponse,
  token: string,
  remember = true,
  request?: Request,
) {
  /**
   * secure يُستنتج من بروتوكول الطلب نفسه:
   * — HTTPS (إنتاج/تطوير الشهادات) → secure=true (إجباري للأمان).
   * — HTTP محلي أو شبكة داخلية (localhost / 192.168.x.x) → secure=false
   *   وإلا المتصفح يرفض تخزين الكوكي والدخول يبدو مكسورًا.
   */
  let secure = process.env.NODE_ENV === 'production';
  if (request) {
    const trustedProxy = process.env.TRUST_PROXY === '1';
    const forwardedProto =
      trustedProxy
        ? request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
        : undefined;
    const proto =
      forwardedProto ||
      (() => {
        try {
          return new URL(request.url).protocol.replace(':', '');
        } catch {
          return undefined;
        }
      })();
    if (proto) secure = proto === 'https';
  }

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    priority: 'high',
    // «تذكرني» = كوكي محفوظ 30 يومًا على الجهاز — غير ذلك كوكي جلسة يموت بالإغلاق
    ...(remember ? { maxAge: SESSION_REMEMBER_IN } : {}),
  });
  return response;
}

export function clearAuthCookie(response: NextResponse, request?: Request) {
  // يجب أن تطابق سمات الحذف سمات الإنشاء حتى يلغي المتصفح الكوكي فعلًا
  // على HTTP (localhost/LAN) — وإلا يبقى المستخدم مسجلًا بعد تسجيل الخروج.
  let secure = process.env.NODE_ENV === 'production';
  if (request) {
    const trustedProxy = process.env.TRUST_PROXY === '1';
    const forwardedProto =
      trustedProxy
        ? request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
        : undefined;
    const proto =
      forwardedProto ||
      (() => {
        try {
          return new URL(request.url).protocol.replace(':', '');
        } catch {
          return undefined;
        }
      })();
    if (proto) secure = proto === 'https';
  }
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    priority: 'high',
    maxAge: 0,
  });
  return response;
}

export async function logoutCurrentSession(response: NextResponse, request?: Request) {
  const session = await getCurrentSession().catch(() => null);
  await revokeCurrentSession().catch(() => undefined);
  if (session) {
    await logAudit({
      user: { id: session.user.id, role: session.user.role },
      request,
      action: 'LOGOUT',
      entity: 'Session',
      detail: { sessionId: session.sessionId },
    });
  }
  return clearAuthCookie(response, request);
}

/**
 * بيانات المستخدم الحالية — تُقرأ من قاعدة البيانات وليس من التوكن،
 * حتى ينعكس التعطيل أو تغيير الدور فورًا.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const current = await getCurrentSession();
  return current?.user ?? null;
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error('جلستك انتهت، سجّل الدخول من جديد');
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('الحساب معطّل أو بانتظار موافقة الإدارة');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (roles && !roles.includes(user.role)) {
    const err = new Error('ليست لديك صلاحية الوصول لهذه الصفحة');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return user;
}
