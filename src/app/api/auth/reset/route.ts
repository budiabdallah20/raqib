import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { hashPassword, revokeAllSessions } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validations';
import { RESET_MAX_ATTEMPTS } from '@/lib/constants';
import {
  assertRateLimit,
  clientKey,
  getClientIp,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }

    const { email, code, password } = parsed.data;
    const ip = getClientIp(request);
    assertRateLimit(`reset-ip:${ip || 'unknown'}`, 20, 15 * 60 * 1000);
    assertRateLimit(
      clientKey(ip, `reset:${email.toLowerCase()}`),
      10,
      15 * 60 * 1000,
    );

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return jsonError('كود التحقق غير صحيح أو منتهي الصلاحية', 400);

    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) {
      return jsonError('انتهت صلاحية الكود. اطلب كودًا جديدًا', 400);
    }
    if (token.attempts >= RESET_MAX_ATTEMPTS) {
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });
      return jsonError('تم تجاوز عدد المحاولات. اطلب كودًا جديدًا', 429);
    }

    const valid = await bcrypt.compare(code, token.codeHash);
    if (!valid) {
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = RESET_MAX_ATTEMPTS - (token.attempts + 1);
      return jsonError(
        remaining > 0
          ? `كود التحقق غير صحيح. المحاولات المتبقية: ${remaining}`
          : 'كود التحقق غير صحيح. اطلب كودًا جديدًا',
        400,
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(password),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    // إبطال كل الجلسات القديمة بعد تغيير كلمة المرور
    await revokeAllSessions(user.id);

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'PASSWORD_RESET',
      entity: 'User',
      detail: { email: user.email },
    });

    return Response.json(
      { ok: true },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر تحديث كلمة المرور');
  }
}
