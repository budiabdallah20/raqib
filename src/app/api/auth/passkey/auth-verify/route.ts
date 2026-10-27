import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, AuthenticatorTransport } from '@simplewebauthn/server';

import { prisma } from '@/lib/db';
import { applyAuthCookie, issueSession } from '@/lib/auth';
import { assertRateLimit, getClientIp, jsonError, logAudit } from '@/lib/security';
import {
  PK_AUTH_CHALLENGE_COOKIE,
  PASSKEY_RP_ID,
  clearChallengeCookie,
  getChallengeCookie,
  passkeyExpectedOrigins,
} from '@/lib/passkey-server';

/**
 * التحقق من الدخول بـPasskey:
 * 1. التحدي من الكوكي (يُصدره السيرفر فقط) ويبطل بعد أول نجاح.
 * 2. البصمة موجودة ومرتبطة بحساب نشِط.
 * 3. التوقيع + عداد التوقيع (كشف الاستنساخ) + التحقق بالمستخدم إلزامي.
 * 4. جلسة JWT بنفس آلية الدخول بكلمة السر + كوكي httpOnly + سجل تدقيق.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    assertRateLimit(`passkey-auth-verify:${ip || 'unknown'}`, 20, 15 * 60 * 1000);

    const expectedChallenge = getChallengeCookie(request, PK_AUTH_CHALLENGE_COOKIE);
    if (!expectedChallenge) {
      return jsonError('انتهت صلاحية جلسة الدخول بالبصمة — جرّب من الأساس', 400);
    }

    const body = (await request.json().catch(() => null)) as { response?: AuthenticationResponseJSON } | null;
    if (!body?.response?.id) return jsonError('بيانات البصمة غير مكتملة', 400);

    const record = await prisma.passkeyCredential.findUnique({
      where: { id: body.response.id },
      select: {
        id: true,
        publicKey: true,
        counter: true,
        transports: true,
        user: { select: { id: true, role: true, email: true, name: true, isActive: true } },
      },
    });

    if (!record || !record.user) {
      return jsonError('البصمة دي مش مسجلة عندنا — سجّل بالباسورد أول وأضف بصمتك من الحساب', 404);
    }
    if (!record.user.isActive) {
      return jsonError('الحساب معطّل أو بانتظار موافقة الإدارة', 403);
    }

    const storedCounter = record.counter;

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.response,
        credential: {
          id: record.id,
          publicKey: new Uint8Array(record.publicKey),
          counter: storedCounter,
          transports: (record.transports ? record.transports.split(',') : []).filter(
            Boolean,
          ) as AuthenticatorTransport[],
        },
        expectedChallenge,
        expectedOrigin: passkeyExpectedOrigins(request),
        expectedRPID: [PASSKEY_RP_ID],
        requireUserVerification: true,
      });
    } catch (error) {
      await logAudit({
        user: { id: record.user.id, role: record.user.role },
        request,
        action: 'PASSKEY_AUTH_FAIL',
        entity: 'PasskeyCredential',
        detail: { reason: (error as Error).message.slice(0, 120) },
      });
      const message = (error as Error).message || '';
      if (/challenge/i.test(message)) {
        return jsonError('انتهت صلاحية المحاولة — جرّب الدخول تاني', 400);
      }
      throw error;
    }

    if (!verification.verified) {
      await logAudit({
        user: { id: record.user.id, role: record.user.role },
        request,
        action: 'PASSKEY_AUTH_FAIL',
        entity: 'PasskeyCredential',
        detail: { reason: 'verification=false' },
      });
      return jsonError('البصمة ما اتأكدتش — جرّب الدخول تاني', 401);
    }

    // دفاع الاستنساخ: لو العداد كان فوق الصفر، الجديد لازِم يكون أكبر منه
    type CounterBag = { credential?: { counter?: number }; credentialInfo?: { counter?: number } };
    const bag = verification as CounterBag;
    const newCounter = (bag.credentialInfo ?? bag.credential)?.counter ?? 0;
    if (storedCounter > 0 && newCounter > 0 && newCounter <= storedCounter) {
      await logAudit({
        user: { id: record.user.id, role: record.user.role },
        request,
        action: 'PASSKEY_CLONE_REJECTED',
        entity: 'PasskeyCredential',
        detail: { storedCounter, newCounter },
      });
      return jsonError('تم اعتراض بصمة قد تكون منسوخة — الحساب مصان', 401);
    }

    await prisma.passkeyCredential.update({
      where: { id: record.id },
      data: { counter: Math.max(storedCounter, newCounter), lastUsedAt: new Date() },
    });

    const token = await issueSession(
      { id: record.user.id, role: record.user.role, email: record.user.email },
      request,
      true,
    );

    const response = NextResponse.json({
      user: { id: record.user.id, name: record.user.name, role: record.user.role },
      message: 'دخلت باللمسة ✌️',
    });
    applyAuthCookie(response, token, true);
    clearChallengeCookie(response, PK_AUTH_CHALLENGE_COOKIE);

    await logAudit({
      user: { id: record.user.id, role: record.user.role },
      request,
      action: 'PASSKEY_AUTH_OK',
      entity: 'PasskeyCredential',
      detail: { method: 'biometric' },
    });

    return response;
  } catch (error) {
    const message = (error as Error).message || '';
    if (/challenge|signature/i.test(message)) {
      return jsonError('محاولة البصمة دي مش متطابقة — جرّب من الأساس', 400);
    }
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر الدخول بالبصمة، حاول مجددًا', status);
  }
}
