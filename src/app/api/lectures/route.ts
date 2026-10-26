import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { lectureSchema } from '@/lib/validations';
import { handleApiError, jsonError, sanitizeString } from '@/lib/security';
import { QR_TTL_MS } from '@/lib/constants';
import { notifyUsers } from '@/lib/notify';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === 'STUDENT') {
      const lectures = await prisma.lecture.findMany({
        where: { course: { enrollments: { some: { studentId: user.id } } } },
        // Explicit select: students must never receive qrToken/qrExpiresAt.
        select: {
          id: true,
          courseId: true,
          title: true,
          location: true,
          startsAt: true,
          isOpen: true,
          createdAt: true,
          course: { select: { name: true, code: true } },
          attendances: {
            where: { studentId: user.id },
            select: { id: true, status: true, scannedAt: true },
          },
        },
        orderBy: { startsAt: 'desc' },
        take: 50,
      });
      return Response.json({ lectures });
    }

    const where = user.role === 'ADMIN' ? {} : { professorId: user.id };
    const lectures = await prisma.lecture.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    return Response.json({ lectures });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    const body = await request.json();

    if (body.action === 'toggle' && body.id) {
      const lecture = await prisma.lecture.findUnique({ where: { id: body.id } });
      if (!lecture) return jsonError('المحاضرة غير موجودة', 404);
      if (user.role !== 'ADMIN' && lecture.professorId !== user.id) {
        return jsonError('ليست لديك صلاحية', 403);
      }
      const isOpen = !lecture.isOpen;
      const updated = await prisma.lecture.update({
        where: { id: lecture.id },
        data: isOpen
          ? {
              isOpen: true,
              qrToken: randomBytes(16).toString('hex'),
              qrExpiresAt: new Date(Date.now() + QR_TTL_MS),
            }
          : { isOpen: false, qrToken: null, qrExpiresAt: null },
      });

      // إشعار الطلاب المسجلين في المادة عند الفتح (WP4)
      if (isOpen) {
        const enrolled = await prisma.enrollment.findMany({
          where: { courseId: lecture.courseId },
          select: { studentId: true },
        });
        await notifyUsers({
          userIds: enrolled.map((e) => e.studentId),
          title: 'محاضرة مفتوحة الآن',
          body: `تم فتح تسجيل الحضور لـ«${lecture.title}» — امسح الرمز أو ادخل الكود اليدوي قبل الإغلاق.`,
          kind: 'LECTURE',
          link: '/student',
        });
      }

      return Response.json({ lecture: updated });
    }

    const parsed = lectureSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId },
    });
    if (!course) return jsonError('المقرر غير موجود', 404);
    if (user.role !== 'ADMIN' && course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    const lecture = await prisma.lecture.create({
      data: {
        courseId: course.id,
        professorId: course.professorId,
        title: sanitizeString(parsed.data.title, 120),
        location: parsed.data.location
          ? sanitizeString(parsed.data.location, 80)
          : null,
        isOpen: true,
        qrToken: randomBytes(16).toString('hex'),
        qrExpiresAt: new Date(Date.now() + QR_TTL_MS),
      },
    });
    return Response.json({ lecture });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
