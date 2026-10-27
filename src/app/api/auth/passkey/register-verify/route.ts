import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, getClientIp, jsonError, logAudit } from '@/lib/security';
import {
  PK_REG_CHALLENGE_COOKIE,
  PASSKEY_RP_ID,
  clearChallengeCookie,
  getChallengeCookie,
  passkeyExpectedOrigins,
} from '@/lib/passkey-server';

/**
 * التحقق من تسجيل Passkey — يتطلب جلسة + تحدي صادر من السيرفر.
 * يُخزن المفتاح العام فقط (لا سر مشترك)، مع عداد التوقيع لكشف الاستنساخ.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    assertRateLimit(`passkey-reg-verify:${user.id}:${ip || 'unknown'}`, 20, 15 * 60 * 1000);

    const expectedChallenge = getChallengeCookie(request, PK_REG_CHALLENGE_COOKIE);
    if (!expectedChallenge) {
      return jsonError('انتهت صلاحية جلسة تسجيل البصمة — ابدأ من الأساس', 400);
    }

    const body = (await request.json().catch(() => null)) as { response?: RegistrationResponseJSON } | null;
    if (!body?.response) return jsonError('بيانات البصمة غير مكتملة', 400);

    // لو التوقيع غير متطابق أو التحدي متشاك — الاستثناء يتصرف كتوصيف 400 بالأسفل
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: passkeyExpectedOrigins(request),
      expectedRPID: [PASSKEY_RP_ID],
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError('توثيق البصمة فشل — جرّب المحاولة مرة أخرى', 400);
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const transports = credential.transports?.join(',') ?? null;

    const saved = await prisma.passkeyCredential.upsert({
      where: { id: credential.id },
      create: {
        id: credential.id,
        userId: user.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
      update: {
        userId: user.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'PASSKEY_REGISTERED',
      entity: 'PasskeyCredential',
      detail: { passkeyId: saved.id.slice(0, 12), deviceType: credentialDeviceType, backedUp: credentialBackedUp },
    });

    const response = NextResponse.json({
      verified: true,
      message: 'تم تسجيل البصمة على حسابك 🎉',
      passkey: { id: saved.id.slice(0, 12), deviceType: credentialDeviceType },
    });
    clearChallengeCookie(response, PK_REG_CHALLENGE_COOKIE);
    return response;
  } catch (error) {
    const message = (error as Error).message || '';
    // اضطراب التحدي/الاستخدام المكرر — المشكلة متوقعة من المستخدم، بترده 400
    if (/challenge|attestation|signature/i.test(message)) {
      return jsonError('محاولة البصمة دي مش متطابقة — ابدأ من الأساس', 400);
    }
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر تسجيل البصمة، حاول مجددًا', status);
  }
}
