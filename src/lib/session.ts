import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { signToken, verifyToken } from './jwt';
import { SESSION_REMEMBER_IN, SESSION_SHORT_IN, COOKIE_NAME } from './constants';
import { getClientIp } from './security';
import { hashPii } from './crypto';
import type { AuthUser, Role } from '@/types';

/**
 * جلسات السيرفر — التوكن نفسه هو "المفتاح"، والقاعدة تحتفظ ببصمته فقط.
 * أي توكن ملغي/منتهي/مزوّر لا يمر حتى لو التوقيع سليم.
 */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

type SessionUser = {
  id: string;
  role: string;
  email?: string | null;
};

export async function issueSession(
  user: SessionUser,
  request?: Request,
  remember = true,
) {
  // تنظيف الجلسات المنتهية/الملغاة القديمة (best effort) — يمنع نمو الجدول بلا حدود
  void prisma.session
    .deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    })
    .catch(() => undefined);

  // لا نضع البريد أو أي PII داخل التوكن: التوكن قابل للقراءة من العميل.
  // البيانات الحساسة تُقرأ من قاعدة البيانات عند كل طلب عبر getSessionUser.
  // «تذكرني» = 30 يومًا محفوظة في القاعدة والكوكي — غير ذلك 12 ساعة.
  const lifetime = remember ? SESSION_REMEMBER_IN : SESSION_SHORT_IN;
  const token = await signToken(
    {
      sub: user.id,
      role: user.role as Role,
      sid: crypto.randomUUID(),
    },
    lifetime,
  );

  const payload = await verifyToken(token);
  if (!payload?.sid) throw new Error('تعذر إنشاء الجلسة');

  await prisma.session.create({
    data: {
      id: payload.sid,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + lifetime * 1000),
      // IP يُخزَّن كبصمة HMAC غير قابلة للعكس — لا نخزن عنوانًا خامًا.
      ip: request ? hashPii(getClientIp(request)) : null,
      userAgent: request?.headers.get('user-agent')?.slice(0, 300) ?? null,
    },
  });

  return token;
}

export async function revokeSession(sessionId: string) {
  await prisma.session
    .updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}

export async function revokeAllSessions(userId: string) {
  await prisma.session
    .updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}

/** يتحقق من التوكن + الجلسة + حالة المستخدم، ويرجع بيانات المستخدم الآمنة */
export async function getSessionUser(token: string): Promise<AuthUser | null> {
  const payload = await verifyToken(token);
  if (!payload?.sid || !payload.sub) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          studentCode: true,
          level: true,
          group: true,
          department: true,
          gender: true,
          avatarUrl: true,
          faceEnrolled: true,
          fingerprintEnrolled: true,
          isActive: true,
          approvedAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.userId !== payload.sub) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  // ربط التوكن بالجلسة: تغيير أي بايت في التوكن يغيّر البصمة
  if (session.tokenHash !== hashToken(token)) return null;
  if (!session.user || !session.user.isActive) return null;

  // تحديث آخر ظهور بهدوء (مرة كل 5 دقائق كحد أقصى)
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    ...session.user,
    role: session.user.role as Role,
  } as AuthUser;
}

export async function getCurrentSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await getSessionUser(token);
  if (!user) return null;
  const payload = await verifyToken(token);
  return { user, token, sessionId: payload?.sid ?? null };
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return;
  const payload = await verifyToken(token);
  if (payload?.sid) await revokeSession(payload.sid);
}
