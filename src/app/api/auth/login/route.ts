import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { applyAuthCookie, issueSession, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import {
  assertRateLimit,
  clearRateLimit,
  clientKey,
  getClientIp,
  jsonError,
  logAudit,
  normalizePhone,
} from '@/lib/security';

// A valid bcrypt hash used to equalise timing for unknown accounts.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.pn8i36j7Y5Q8cH8pD1nZg8Uw0lJ9j5u';
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }

    const { identifier, password, remember } = parsed.data;
    const ip = getClientIp(request);
    const key = clientKey(ip, identifier);

    // حد عام لكل IP + حد لكل حساب/جهاز — يمنع توزيع المحاولات
    assertRateLimit(`login-ip:${ip || 'unknown'}`, 40, 15 * 60 * 1000);
    assertRateLimit(key, 10, 15 * 60 * 1000);

    const lower = identifier.toLowerCase();
    const phone = normalizePhone(identifier);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lower },
          { phone: identifier },
          { phone },
          { name: identifier },
        ],
      },
    });

    // قفل الحساب حتى لو تغيّر الـ IP
    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.max(
        1,
        Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000),
      );
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'LOGIN_LOCKED',
        entity: 'User',
        detail: { identifier, minutes },
      });
      return jsonError(
        `الحساب مقفول مؤقتًا بسبب محاولات دخول كثيرة. جرّب بعد ${minutes} دقيقة`,
        429,
      );
    }

    const valid = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);

    if (!user || !valid) {
      if (user) {
        const failures = user.failedLoginAttempts + 1;
        const shouldLock = failures >= MAX_FAILED;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: shouldLock ? 0 : failures,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MS) : null,
          },
        });
        await logAudit({
          user: { id: user.id, role: user.role },
          request,
          action: shouldLock ? 'LOGIN_LOCKOUT' : 'LOGIN_FAILED',
          entity: 'User',
          detail: { identifier, failures: shouldLock ? MAX_FAILED : failures },
        });
      } else {
        await logAudit({
          user: null,
          request,
          action: 'LOGIN_FAILED',
          entity: 'User',
          detail: { identifier: identifier.slice(0, 80), reason: 'unknown_user' },
        });
      }
      return jsonError('بيانات الدخول غير صحيحة. تحقق وحاول مجددًا', 401);
    }

    // كلمة المرور صحيحة لكن الحساب معطّل/بانتظار الموافقة
    if (!user.isActive) {
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'LOGIN_INACTIVE',
        entity: 'User',
        detail: { identifier },
      });
      return jsonError(
        'الحساب معطّل أو بانتظار موافقة الإدارة. تواصل مع إدارة الكلية',
        403,
      );
    }

    clearRateLimit(key);
    if (user.failedLoginAttempts || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = await issueSession(
      { id: user.id, role: user.role, email: user.email },
      request,
      Boolean(remember),
    );

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'LOGIN_OK',
      entity: 'User',
      detail: { method: 'password' },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        studentCode: user.studentCode,
        avatarUrl: user.avatarUrl,
      },
    });
    return applyAuthCookie(response, token, Boolean(remember));
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر تسجيل الدخول', status);
  }
}
