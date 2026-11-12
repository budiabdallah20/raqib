/**
 * POST /api/attendance/scan — مسح حضور بخط الدفاع الجديد (WP3/التوجيه):
 *   1) رمز QR موقّع JWT HS256 يدوّر كل 10 ثوانٍ (exp=15s) — تحقق موضعي بلا قاعدة.
 *   2) Geofence GPS: إذا للمحاضرة حدود ({lat,lng,radiusM}) فالموقع إلزامي.
 *   3) Passkey (WebAuthn) اختياري أثناء المسح — إن أُرسل، يُتحقق من التوقيع
 *      بتحدي من السيرفر، ورفضُه يُسجَّل بالتدقيق.
 *   4) توافق خلفي كامل مع رمز DB السابق والكود اليدوي 6 أرقام.
 */
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';
import { attendanceSchema } from '@/lib/validations';
import { isManualCode, manualCodeOf } from '@/lib/qr';
import { checkGeofence, parseGeofence, verifyQrToken } from '@/lib/qr-sign';
import { recordAttendance } from '@/lib/attendance-record';
import {
  PK_AUTH_CHALLENGE_COOKIE,
  PASSKEY_RP_ID,
  getChallengeCookie,
  passkeyExpectedOrigins,
} from '@/lib/passkey-server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, AuthenticatorTransport } from '@simplewebauthn/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = attendanceSchema.extend({
  /** إحداثيات الطالب من جهازه (نحوها بالـHTML Geolocation API) */
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracyM: z.number().min(0).max(10_000).optional(),
  /** بصمة Passkey إن أراد الطالب توقيع المسح بنفسه */
  passkey: z.object({ response: z.unknown() }).passthrough().optional(),
});

function extractToken(raw: string) {
  try {
    const url = new URL(raw);
    return url.searchParams.get('token') || raw;
  } catch {
    const match = raw.match(/token=([A-Za-z0-9]+)/);
    return match?.[1] || raw.trim();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(
      `attendance-scan:${user.id}`,
      12,
      60 * 1000,
      'محاولات تسجيل حضور كثيرة. انتظر دقيقة ثم حاول مرة أخرى',
    );

    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة', 400, 'INVALID');

    const parsed = bodySchema.safeParse({
      ...body,
      token: extractToken(String(body.token || '')),
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'رمز غير صالح', 400, 'INVALID');
    }

    const raw = parsed.data.token;

    /* ── 1) فك التوكن الديناميكي ─────────────────────────── */
    const signed = verifyQrToken(raw);

    type LectureWithCourse = Prisma.LectureGetPayload<{ include: { course: true } }>;
    let lecture: LectureWithCourse | null = null;
    let via: 'QR_JWT' | 'QR' | 'MANUAL' = 'QR';

    if (signed) {
      const candidate = (await prisma.lecture.findUnique({
        where: { id: signed.lec },
        include: { course: true },
      })) as LectureWithCourse | null;

      // الحماية الدائرية: يجب أن يكون هو رمز التدوير الحالي محفوظًا في القاعدة
      if (candidate && candidate.qrToken === raw && candidate.courseId === signed.crs) {
        lecture = candidate;
        via = 'QR_JWT';
      }
    }

    if (!lecture) {
      /* ── توافق خلفي: كود يدوي 6 أرقام ── */
      if (isManualCode(raw)) {
        via = 'MANUAL';
        const candidates = await prisma.lecture.findMany({
          where: { isOpen: true, qrExpiresAt: { gte: new Date() }, qrToken: { not: null } },
          select: { id: true, qrToken: true },
        });
        const match = candidates.find((c) => c.qrToken && manualCodeOf(c.qrToken) === raw);
        if (!match) return jsonError('الكود اليدوي غير صحيح أو منتهي', 400, 'INVALID');
        lecture = (await prisma.lecture.findUnique({
          where: { id: match.id },
          include: { course: true },
        })) as LectureWithCourse | null;
      } else {
        /* ── توافق خلفي: رمز قاعدة قديم (hex) ── */
        lecture = (await prisma.lecture.findUnique({
          where: { qrToken: raw },
          include: { course: true },
        })) as LectureWithCourse | null;
      }
    }

    if (!lecture) {
      return jsonError('رمز الحضور غير صالح — اطلب رمزًا جديدًا', 400, 'OUT_OF_RANGE');
    }
    if (!lecture.isOpen) return jsonError('المحاضرة مغلقة', 400, 'CLOSED');
    if (lecture.qrExpiresAt && lecture.qrExpiresAt.getTime() < Date.now()) {
      return jsonError('انتهت صلاحية رمز الحضور — انتظر تدوير الرمز', 400, 'EXPIRED');
    }

    /* ── 2) Geofence GPS ────────────────────────────────── */
    const effectiveGeofence =
      parseGeofence(lecture.geofence) ?? (signed ? signed.geo : null);
    // بلا إحداثيات ✓ يرسَل null — النوع يتكفل والفاحص يردّ: مطلوب لكن مرفوض
    const geoPoint =
      parsed.data.lat != null && parsed.data.lng != null
        ? {
            lat: parsed.data.lat,
            lng: parsed.data.lng,
            accuracyM: parsed.data.accuracyM,
          }
        : null;
    const geoResult = checkGeofence(effectiveGeofence, geoPoint);
    if (!geoResult.allowed) {
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'ATTENDANCE_SCAN_GEOFENCE_FAIL',
        entity: 'Lecture',
        detail: {
          lectureId: lecture.id,
          required: geoResult.required,
          distanceM: geoResult.distanceM ?? null,
        },
      });
      return jsonError(
        'أنت خارج نطاق المحاضرة — تأكد أنك في قاعة الشعبت وقيد تفعيل الموقع',
        403,
        'GEOFENCE',
      );
    }

    /* ── 3) Passkey (اختياري) ───────────────────────────── */
    if (parsed.data.passkey) {
      const response = parsed.data.passkey as { response?: AuthenticationResponseJSON };
      const challenge = getChallengeCookie(request, PK_AUTH_CHALLENGE_COOKIE);
      const resp = response.response;

      if (!challenge || !resp?.id) {
        return jsonError('بصمة المسح غير مكتملة — ابدأ بصمة من جديد', 400, 'PASSKEY_INVALID');
      }

      const credential = await prisma.passkeyCredential.findUnique({
        where: { id: resp.id },
        select: { counter: true, publicKey: true, transports: true, user: { select: { id: true } } },
      }).catch(() => null);

      if (!credential || credential.user?.id !== user.id) {
        return jsonError('هذه البصمة غير مرتبطة بحسابك', 403, 'PASSKEY_INVALID');
      }

      try {
        const verification = await verifyAuthenticationResponse({
          response: resp,
          credential: {
            id: resp.id,
            publicKey: new Uint8Array(credential.publicKey),
            counter: credential.counter,
            transports: (credential.transports ? credential.transports.split(',') : []).filter(
              Boolean,
            ) as AuthenticatorTransport[],
          },
          expectedChallenge: challenge,
          expectedOrigin: passkeyExpectedOrigins(request),
          expectedRPID: [PASSKEY_RP_ID],
          requireUserVerification: true,
        });
        if (!verification.verified) {
          return jsonError('البصمة ما اتأكدتش — أعد المحاولة', 401, 'PASSKEY_FAILED');
        }
        await logAudit({
          user: { id: user.id, role: user.role },
          request,
          action: 'PASSKEY_SCAN_OK',
          entity: 'Attendance',
          detail: { lectureId: lecture.id },
        });
      } catch (error) {
        await logAudit({
          user: { id: user.id, role: user.role },
          request,
          action: 'PASSKEY_SCAN_FAIL',
          entity: 'PasskeyCredential',
          detail: { lectureId: lecture.id, reason: (error as Error).message.slice(0, 120) },
        });
        return jsonError('البصمة ما اتأكدتش — أعد المحاولة', 401, 'PASSKEY_FAILED');
      }
    }

    /* ── 4) التسجيل المشترك ─────────────────────────────── */
    const result = await recordAttendance({
      studentId: user.id,
      lecture,
      via,
      audit: (detail) =>
        logAudit({
          user: { id: user.id, role: user.role },
          request,
          action: 'ATTENDANCE_SCAN',
          entity: 'Attendance',
          detail: { ...detail, method: 'scan-endpoint' },
        }),
    });

    if (result.kind === 'forbidden') {
      return jsonError(result.message, 403, 'NOT_ENROLLED');
    }
    if (result.kind === 'duplicate') {
      return Response.json({
        duplicate: true,
        message: result.message,
        attendance: result.attendance,
        lecture: { title: result.lecture.title, course: result.lecture.courseName },
      });
    }

    return Response.json({
      attendance: result.attendance,
      lecture: { title: result.lecture.title, course: result.lecture.courseName },
      verified: { geofence: geoResult.required ? 'within' : 'none', passkey: Boolean(parsed.data.passkey), via },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
