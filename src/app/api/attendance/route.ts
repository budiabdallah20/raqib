import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { attendanceSchema } from '@/lib/validations';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';
import { isManualCode, manualCodeOf } from '@/lib/qr';
import { recordAttendance } from '@/lib/attendance-record';

function extractToken(raw: string) {
  try {
    const url = new URL(raw);
    return url.searchParams.get('token') || raw;
  } catch {
    const match = raw.match(/token=([A-Za-z0-9]+)/);
    return match?.[1] || raw.trim();
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === 'STUDENT') {
      const records = await prisma.attendance.findMany({
        where: { studentId: user.id },
        select: {
          id: true,
          lectureId: true,
          studentId: true,
          status: true,
          scannedAt: true,
          // لا يُسرَّب سر رمز الحضور للطالب أبدًا — select صريح بلا التوكن
          lecture: {
            select: {
              id: true,
              courseId: true,
              title: true,
              location: true,
              startsAt: true,
              isOpen: true,
              course: { select: { name: true, code: true } },
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
        take: 200,
      });
      const totalLectures = await prisma.lecture.count({
        where: { course: { enrollments: { some: { studentId: user.id } } } },
      });
      return Response.json({
        records,
        stats: {
          present: records.length,
          totalLectures,
        },
      });
    }

    const records = await prisma.attendance.findMany({
      where:
        user.role === 'ADMIN'
          ? undefined
          : { lecture: { professorId: user.id } },
      include: {
        student: { select: { name: true, email: true, studentCode: true } },
        lecture: {
          include: { course: { select: { name: true, code: true } } },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: 120,
    });
    return Response.json({ records });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

/* ─── كود الحالة المعياري (WP3): نجح / منتهي / مغلق / مكرر / خارج النطاق ─── */
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    // الكود اليدوي 6 أرقام — بدون حد محاولات يمكن تخمينه بالقوة الغاشمة
    assertRateLimit(
      `attendance-scan:${user.id}`,
      12,
      60 * 1000,
      'محاولات تسجيل حضور كثيرة. انتظر دقيقة ثم حاول مرة أخرى',
    );
    const body = await request.json().catch(() => ({}));
    const parsed = attendanceSchema.safeParse({
      token: extractToken(body.token || ''),
    });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'رمز غير صالح', 400, 'INVALID');
    }

    let lecture;
    let via = 'QR' as 'QR' | 'MANUAL';
    const raw = parsed.data.token;

    if (isManualCode(raw)) {
      // كود يدوي 6 أرقام — من محاضرات مفتوحة صالحة حاليًا
      via = 'MANUAL';
      const candidates = await prisma.lecture.findMany({
        where: { isOpen: true, qrExpiresAt: { gte: new Date() }, qrToken: { not: null } },
        select: { id: true, qrToken: true },
      });
      const match = candidates.find((c) => c.qrToken && manualCodeOf(c.qrToken) === raw);
      if (!match) return jsonError('الكود اليدوي غير صحيح أو منتهي', 400, 'INVALID');
      lecture = await prisma.lecture.findUnique({
        where: { id: match.id },
        include: { course: true },
      });
    } else {
      lecture = await prisma.lecture.findUnique({
        where: { qrToken: raw },
        include: { course: true },
      });
    }

    if (!lecture) {
      // إمّا رمز من محاضرة قديمة بدور، أو رمز مزيف — الحالة: خارج النطاق
      return jsonError('رمز الحضور غير صالح — اطلب رمزًا جديدًا', 400, 'OUT_OF_RANGE');
    }
    if (!lecture.isOpen) return jsonError('المحاضرة مغلقة', 400, 'CLOSED');
    if (lecture.qrExpiresAt && lecture.qrExpiresAt.getTime() < Date.now()) {
      return jsonError('انتهت صلاحية رمز الحضور — انتظر تدوير الرمز', 400, 'EXPIRED');
    }

    // ── أزآت التسجيل: المسار الواحد المشترك مع /api/attendance/scan ──
    // (التسجيل/التكرار/التأخير/التدقيق/إنذار الحرمان كلها داخل recordAttendance)
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
          detail,
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
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
