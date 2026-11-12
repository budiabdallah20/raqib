import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { z } from 'zod';

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
const bodySchema = z
  .object({
    response: z
      .object({
        id: z.string().min(1).max(1024),
        rawId: z.string().min(1).max(4096),
        type: z.literal('public-key'),
        response: z
          .object({
            clientDataJSON: z.string().min(1).max(16_384),
            attestationObject: z.string().min(1).max(131_072),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    assertRateLimit(`passkey-reg-verify:${user.id}:${ip || 'unknown'}`, 20, 15 * 60 * 1000);

    const expectedChallenge = getChallengeCookie(request, PK_REG_CHALLENGE_COOKIE);
    if (!expectedChallenge) {
      return jsonError('انتهت صلاحية جلسة تسجيل البصمة — ابدأ من الأساس', 400);
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('بيانات البصمة غير مكتملة', 400);
    const registrationResponse = parsed.data.response as unknown as RegistrationResponseJSON;

    // لو التوقيع غير متطابق أو التحدي متشاك — الاستثناء يتصرف كتوصيف 400 بالأسفل
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
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

    // حماية من إعادة ربط بصمة مسجلة لحساب آخر (نفس الجهاز المستخدم سابقًا):
    // نرفض الطلب ونسجل المحاولة في سجل التدقيق حتى لو نجح التوثيق نفسه
    const existing = await prisma.passkeyCredential.findUnique({
      where: { id: credential.id },
      select: { userId: true },
    });
    if (existing && existing.userId !== user.id) {
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'PASSKEY_REBIND_BLOCKED',
        entity: 'PasskeyCredential',
        detail: { passkeyId: credential.id.slice(0, 12), ownerId: existing.userId.slice(0, 8) },
      });
      return jsonError('البصمة دي مسجَّلة على حساب آخر — استخدم بصمة جديدة', 409);
    }

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
