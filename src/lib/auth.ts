import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { COOKIE_NAME, JWT_EXPIRES_IN } from './constants';
import { getCurrentSession, revokeCurrentSession } from './session';
import { logAudit } from './security';
import type { AuthUser, Role } from '@/types';

export { signToken, verifyToken } from './jwt';
export {
  issueSession,
  revokeSession,
  revokeAllSessions,
  getSessionUser,
  hashToken,
} from './session';

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
) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    priority: 'high',
    ...(remember ? { maxAge: JWT_EXPIRES_IN } : {}),
  });
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
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
  return clearAuthCookie(response);
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
