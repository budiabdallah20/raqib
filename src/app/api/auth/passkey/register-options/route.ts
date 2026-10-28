import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransport } from '@simplewebauthn/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, getClientIp, jsonError, logAudit } from '@/lib/security';
import { PASSKEY_RP_ID, PASSKEY_RP_NAME, setChallengeCookie, PK_REG_CHALLENGE_COOKIE } from '@/lib/passkey-server';

/**
 * خيارات تسجيل Passkey — يتطلب جلسة قائمة.
 * التحدي يُخزن في كوكي httpOnly، ولا يُعاد استخدامه بعد التحقق.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    assertRateLimit(`passkey-reg-options:${user.id}:${ip || 'unknown'}`, 20, 15 * 60 * 1000);

    const existing = await prisma.passkeyCredential.findMany({
      where: { userId: user.id },
      select: { id: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpID: PASSKEY_RP_ID,
      rpName: PASSKEY_RP_NAME,
      userID: new TextEncoder().encode(user.id),
      userName: user.email ?? user.phone ?? `user-${user.id}`,
      userDisplayName: user.name,
      attestationType: 'none',
      // منع تسجيل نفس البصمة مرتين لنفس الحساب
      excludeCredentials: existing.map((pk) => ({
        id: pk.id,
        transports: (pk.transports ? pk.transports.split(',') : []).filter(Boolean) as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        // مفتاح مقيم (resident/discoverable) إلزامي: البصمة تُخزن داخل موبيايل
        // المستخدم ويمكن الدخول بيها لاحقًا بلا بريد ولا رقم جامعي.
        residentKey: 'required',
        userVerification: 'required', // البصمة/القفل إلزامية عند الاستخدام
      },
    });

    const response = NextResponse.json({ options });
    setChallengeCookie(response, PK_REG_CHALLENGE_COOKIE, options.challenge);

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'PASSKEY_REG_OPTIONS',
      entity: 'PasskeyCredential',
      detail: { method: 'options' },
    });

    return response;
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر تجهيز تسجيل البصمة، حاول مجددًا', status);
  }
}
