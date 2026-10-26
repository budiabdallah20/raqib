/**
 * لوحة عرض المحاضرة (WP3) — للأدمن/الدكتور فقط
 * GET /api/lectures/board?lectureId=…
 * يدوّر QR تلقائيًا: إذا صار التوكن أقدم من 20 ثانية نولد رمز جديد + عمر قصير.
 * يعيد: التوكن الحالي + الكود اليدوي + عدد الحاضرين لحظيًا + آخر 5 مسحات.
 * لا يُعاد أي شيء للطالب — هذه لوحة الدكتور وحده.
 */
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';
import { QR_ROTATE_MS, QR_SESSION_TTL_MS } from '@/lib/constants';
import { manualCodeOf } from '@/lib/qr';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({ lectureId: z.string().min(1) });

export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      lectureId: (url.searchParams.get('lectureId') || '').trim(),
    });
    if (!parsed.success) return jsonError('حدد المحاضرة المطلوبة');

    const lecture = await prisma.lecture.findUnique({
      where: { id: parsed.data.lectureId },
      include: { course: { select: { name: true, code: true } } },
    });
    if (!lecture) return jsonError('المحاضرة غير موجودة', 404);
    if (user.role !== 'ADMIN' && lecture.professorId !== user.id) {
      return jsonError('ليست لديك صلاحية على هذه المحاضرة', 403);
    }

    if (!lecture.isOpen) {
      return Response.json({
        closed: true,
        attendees: 0,
        lecture: { id: lecture.id, title: lecture.title, location: lecture.location, startsAt: lecture.startsAt, course: lecture.course },
      });
    }

    // ── التدوير التلقائي: التوكن أقدم من 20 ثانية؟ ──
    const issuedAt = lecture.qrExpiresAt
      ? lecture.qrExpiresAt.getTime() - QR_SESSION_TTL_MS
      : 0;
    const needsRotation = !lecture.qrToken || Date.now() - issuedAt >= QR_ROTATE_MS;

    let token = lecture.qrToken ?? '';
    let expiresAt = lecture.qrExpiresAt ?? new Date();

    if (needsRotation) {
      token = randomBytes(16).toString('hex');
      expiresAt = new Date(Date.now() + QR_SESSION_TTL_MS);
      await prisma.lecture.update({
        where: { id: lecture.id },
        data: { qrToken: token, qrExpiresAt: expiresAt },
      });
    }

    // أعداد لحظية وآخر 5 مسحات
    const [attendees, current, lateCount, recent] = await Promise.all([
      prisma.attendance.count({ where: { lectureId: lecture.id } }),
      prisma.attendance.count({ where: { lectureId: lecture.id, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { lectureId: lecture.id, status: 'LATE' } }),
      prisma.attendance.findMany({
        where: { lectureId: lecture.id },
        select: {
          status: true, scannedAt: true,
          student: { select: { name: true, studentCode: true, group: true } },
        },
        orderBy: { scannedAt: 'desc' },
        take: 5,
      }),
    ]);

    // المسح يُسجل في AuditLog من /api/attendance — لا داعي لمسح عشوائي هنا

    return Response.json({
      closed: false,
      lecture: {
        id: lecture.id,
        title: lecture.title,
        location: lecture.location,
        startsAt: lecture.startsAt,
        course: lecture.course,
      },
      token,
      expiresAt: expiresAt.toISOString(),
      manualCode: manualCodeOf(token),
      attendees,
      present: current,
      late: lateCount,
      // عدد المسجلين المتوقع في المادة — لعرض نسبة الحضور اللحظية
      expected: await prisma.enrollment.count({ where: { courseId: lecture.courseId } }),
      recent: recent.map((r) => ({
        name: r.student.name,
        code: r.student.studentCode,
        group: r.student.group,
        status: r.status,
        at: r.scannedAt,
      })),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
