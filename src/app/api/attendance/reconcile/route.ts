import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, handleApiError, jsonError, redactDetail, sanitizeString } from '@/lib/security';

export const dynamic = 'force-dynamic';

const correctionSchema = z.object({
  lectureId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['PRESENT', 'LATE']),
  reason: z.string().trim().min(12).max(300),
});

function reject(message: string, status: number): never {
  throw Object.assign(new Error(message), { status });
}

// A paginated roster, scoped to the lecture owner or an administrator.
export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    const url = new URL(request.url);
    const lectureId = url.searchParams.get('lectureId') || '';
    const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1));
    if (!lectureId) return jsonError('حدد المحاضرة', 400);

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true, title: true, startsAt: true, cancelledAt: true, isOpen: true, professorId: true,
        courseId: true, course: { select: { code: true, name: true } },
      },
    });
    if (!lecture) return jsonError('المحاضرة غير موجودة', 404);
    if (user.role !== 'ADMIN' && lecture.professorId !== user.id) return jsonError('ليست لديك صلاحية', 403);

    const where = { courseId: lecture.courseId, status: 'ACTIVE' };
    const [total, enrollments] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        select: { student: { select: { id: true, name: true, studentCode: true, group: true } } },
        // studentCode is encrypted; order by the enrollment row for stable pages.
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * 50,
        take: 50,
      }),
    ]);
    const ids = enrollments.map(({ student }) => student.id);
    const records = ids.length ? await prisma.attendance.findMany({
      where: { lectureId, studentId: { in: ids } },
      select: { id: true, studentId: true, status: true, scannedAt: true },
    }) : [];
    const byStudent = new Map(records.map((record) => [record.studentId, record]));
    return Response.json({
      lecture: {
        id: lecture.id, title: lecture.title, startsAt: lecture.startsAt,
        cancelled: Boolean(lecture.cancelledAt), isOpen: lecture.isOpen,
        course: lecture.course,
      },
      total, page, pageSize: 50,
      roster: enrollments.map(({ student }) => ({ ...student, attendance: byStudent.get(student.id) ?? null })),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر عرض كشف الحضور');
  }
}

// Instructor/admin correction with a required reason, atomic audit and student notice.
export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    assertRateLimit(`attendance-correct:${user.id}`, 100, 15 * 60 * 1000, 'طلبات تصحيح كثيرة — انتظر قليلًا');
    const parsed = correctionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('حدد الطالب والحالة وسببًا واضحًا (12 حرفًا على الأقل)', 400);
    const { lectureId, studentId, status } = parsed.data;
    const reason = sanitizeString(parsed.data.reason, 300);
    if (reason.length < 12) return jsonError('سبب التصحيح قصير جدًا', 400);

    const result = await prisma.$transaction(async (tx) => {
      const lecture = await tx.lecture.findUnique({
        where: { id: lectureId },
        select: { id: true, title: true, startsAt: true, professorId: true, courseId: true, cancelledAt: true, course: { select: { code: true } } },
      });
      if (!lecture) reject('المحاضرة غير موجودة', 404);
      if (user.role !== 'ADMIN' && lecture.professorId !== user.id) reject('ليست لديك صلاحية', 403);
      if (lecture.cancelledAt) reject('لا يمكن تصحيح حضور محاضرة ملغاة', 409);
      if (lecture.startsAt.getTime() > Date.now()) reject('لم تبدأ المحاضرة بعد', 409);
      const enrollment = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: lecture.courseId } },
        select: { status: true },
      });
      if (enrollment?.status !== 'ACTIVE') reject('الطالب غير مسجل في هذا المقرر', 403);
      const previous = await tx.attendance.findUnique({
        where: { lectureId_studentId: { lectureId, studentId } },
        select: { status: true },
      });
      if (previous?.status === status) return { changed: false, status };
      await tx.attendance.upsert({
        where: { lectureId_studentId: { lectureId, studentId } },
        create: { lectureId, studentId, status },
        update: { status },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id, userRole: user.role, action: 'ATTENDANCE_CORRECTION', entity: 'Attendance',
          detail: JSON.stringify(redactDetail({ lectureId, studentId, from: previous?.status ?? 'ABSENT', to: status, reason })),
        },
      });
      await tx.notification.create({
        data: {
          userId: studentId, kind: 'ALERT', title: 'تم تحديث سجل حضورك',
          body: `${lecture.course.code} · ${lecture.title}: ${status === 'PRESENT' ? 'حاضر' : 'متأخر'}. راجع سجل الحضور.`,
          link: '/student/attendance',
        },
      });
      return { changed: true, status };
    });
    return Response.json(result);
  } catch (error) {
    return handleApiError(error, 'تعذر تصحيح الحضور');
  }
}
