import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransport } from '@simplewebauthn/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import {
  assertRateLimit,
  getClientIp,
  jsonError,
  logAudit,
  normalizePhone,
} from '@/lib/security';
import {
  PK_AUTH_CHALLENGE_COOKIE,
  PASSKEY_RP_ID,
  setChallengeCookie,
} from '@/lib/passkey-server';

/**
 * خيارات الدخول بـPasskey — عام (بدون جلسة).
 * identifier (اختياري): إيميل/تليفون/رقم جامعي — يقيد البصمات بحسابه؛
 * بدونه يسمح بأي بصمة مسجلة (resident credential) واختيار المستخدم من المعدة.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    assertRateLimit(`passkey-auth-options:${ip || 'unknown'}`, 30, 15 * 60 * 1000);

    const parsed = z
      .object({ identifier: z.string().trim().max(120).optional() })
      .strict()
      .safeParse((await request.json().catch(() => null)) ?? {});
    if (!parsed.success) return jsonError('بيانات غير صالحة');

    let allowCredentials: { id: string; transports: AuthenticatorTransport[] }[] = [];
    let targetedUserId: string | null = null;

    if (parsed.data.identifier) {
      const identifier = parsed.data.identifier.toLowerCase();
      const phone = normalizePhone(identifier);
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier },
            { phone },
            { studentCode: identifier },
          ],
        },
        select: {
          id: true,
          isActive: true,
          passkeys: { select: { id: true, transports: true } },
        },
      });
      // لا كشف ولا استبنج: الحساب أو بصماته الغير موجودة تتصرف كإخفاء الشخص نفسه
      if (user && user.isActive) {
        targetedUserId = user.id;
        allowCredentials = user.passkeys.map((pk) => ({
          id: pk.id,
          transports: (pk.transports ? pk.transports.split(',') : []).filter(
            Boolean,
          ) as AuthenticatorTransport[],
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: PASSKEY_RP_ID,
      userVerification: 'required',
      allowCredentials,
    });

    const response = NextResponse.json({ options });
    setChallengeCookie(response, PK_AUTH_CHALLENGE_COOKIE, options.challenge);

    await logAudit({
      request,
      action: 'PASSKEY_AUTH_OPTIONS',
      entity: 'PasskeyCredential',
      detail: { targeted: Boolean(targetedUserId) },
    });

    return response;
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر تجهيز الدخول بالبصمة، حاول مجددًا', status);
  }
}
