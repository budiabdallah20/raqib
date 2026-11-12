import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { lectureSchema, lectureToggleSchema } from '@/lib/validations';
import { handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';
import { QR_SESSION_TTL_MS } from '@/lib/constants';
import { signQrToken, parseGeofence } from '@/lib/qr-sign';
import { notifyUsers } from '@/lib/notify';
import { z } from 'zod';

/** حدود قاعة المحاضرة — إما null لتفعيلها أو إلغاءها */
const geofenceSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radiusM: z.number().int().min(20).max(2000).optional(),
  })
  .nullable()
  .optional();

function geofenceJsonOf(body: unknown) {
  const parsed = geofenceSchema.safeParse((body as { geofence?: unknown })?.geofence);
  if (!parsed.success) return undefined;
  return parsed.data ? JSON.stringify(parsed.data) : null;
}

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === 'STUDENT') {
      const lectures = await prisma.lecture.findMany({
        where: { course: { enrollments: { some: { studentId: user.id, status: 'ACTIVE' } } } },
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
    const body = await request.json().catch(() => ({}));

    const toggleParsed = lectureToggleSchema.safeParse(body);
    if (toggleParsed.success) {
      const lecture = await prisma.lecture.findUnique({
        where: { id: toggleParsed.data.id },
      });
      if (!lecture) return jsonError('المحاضرة غير موجودة', 404);
      if (user.role !== 'ADMIN' && lecture.professorId !== user.id) {
        return jsonError('ليست لديك صلاحية', 403);
      }
      const isOpen = !lecture.isOpen;
      // geofence: undefined = لم يتغير في الطلب، null = مسح الحدود، object = ضبط
      const geofenceJson = geofenceJsonOf(body);
      const effectiveGeofenceJson =
        geofenceJson !== undefined ? geofenceJson : lecture.geofence;

      const updated = await prisma.lecture.update({
        where: { id: lecture.id },
        data: isOpen
          ? {
              isOpen: true,
              // رمز ديناميكي موقّع يُفتح بعمر 15s ويتدوير كل 10s عبر اللوحة
              qrToken: signQrToken(
                {
                  lec: lecture.id,
                  crs: lecture.courseId,
                  geofence: parseGeofence(effectiveGeofenceJson),
                },
                QR_SESSION_TTL_MS / 1000,
              ),
              qrExpiresAt: new Date(Date.now() + QR_SESSION_TTL_MS),
              ...(geofenceJson !== undefined ? { geofence: geofenceJson } : {}),
            }
          : {
              isOpen: false,
              qrToken: null,
              qrExpiresAt: null,
              ...(geofenceJson !== undefined ? { geofence: geofenceJson } : {}),
            },
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

      await logAudit({
        user,
        request,
        action: isOpen ? 'LECTURE_OPEN' : 'LECTURE_CLOSE',
        entity: 'Lecture',
        detail: { lectureId: lecture.id, courseId: lecture.courseId },
      });

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

    const geofenceJson = geofenceJsonOf(body);
    // الـid يُولَّد هنا ليُوقَّع داخل JWT المحاضرة (Prisma @default(cuid()) يقبل قيمة صريحة)
    const lectureId = randomUUID();
    const lecture = await prisma.lecture.create({
      data: {
        id: lectureId,
        courseId: course.id,
        professorId: course.professorId,
        title: sanitizeString(parsed.data.title, 120),
        location: parsed.data.location
          ? sanitizeString(parsed.data.location, 80)
          : null,
        isOpen: true,
        geofence: geofenceJson ?? null,
        qrToken: signQrToken(
          {
            lec: lectureId,
            crs: course.id,
            geofence: parseGeofence(geofenceJson),
          },
          QR_SESSION_TTL_MS / 1000,
        ),
        qrExpiresAt: new Date(Date.now() + QR_SESSION_TTL_MS),
      },
    });
    await logAudit({
      user,
      request,
      action: 'LECTURE_CREATE',
      entity: 'Lecture',
      detail: { lectureId: lecture.id, courseId: course.id },
    });
    return Response.json({ lecture });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
