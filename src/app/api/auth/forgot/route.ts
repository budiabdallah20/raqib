import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations';
import { generateResetCode, sendPasswordResetEmail } from '@/lib/mailer';
import { RESET_CODE_TTL_MS } from '@/lib/constants';
import {
  assertRateLimit,
  clientKey,
  getClientIp,
  handleApiError,
  jsonError,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بريد غير صالح');
    }

    const email = parsed.data.email.toLowerCase();
    const ip = getClientIp(request);
    assertRateLimit(`forgot-ip:${ip || 'unknown'}`, 10, 15 * 60 * 1000);
    assertRateLimit(
      clientKey(ip, `forgot:${email}`),
      5,
      15 * 60 * 1000,
      'طلبت أكوادًا كثيرة. انتظر 15 دقيقة ثم حاول مجددًا',
    );

    const user = await prisma.user.findUnique({ where: { email } });

    // Always answer the same way to avoid leaking registered emails.
    if (!user || !user.isActive) {
      return Response.json(
        { ok: true, delivered: false, expiresIn: 600 },
        { headers: { 'cache-control': 'no-store' } },
      );
    }

    const code = generateResetCode();
    const codeHash = await bcrypt.hash(code, 10);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
        },
      }),
    ]);

    const mail = await sendPasswordResetEmail(email, code, user.name);
    const showDevCode =
      process.env.NODE_ENV === 'development' &&
      process.env.SHOW_DEV_RESET_CODE !== '0';

    return Response.json(
      {
        ok: true,
        delivered: mail.delivered,
        expiresIn: Math.round(RESET_CODE_TTL_MS / 1000),
        ...(showDevCode ? { devCode: code } : {}),
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر إرسال كود التحقق');
  }
}
