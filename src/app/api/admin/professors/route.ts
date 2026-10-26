import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(120).optional(),
});

export async function GET(request: Request) {
  try {
    await requireUser(['ADMIN']);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // ── تفاصيل دكتور: مقرراته + آخر محاضراته + ملفاته ──
    if (id) {
      const professor = await prisma.user.findFirst({
        where: { id, role: 'PROFESSOR' },
        select: { id: true, name: true, email: true, phone: true, isActive: true, approvedAt: true, createdAt: true },
      });
      if (!professor) return jsonError('الدكتور غير موجود', 404);

      const [courses, lectures, resources] = await Promise.all([
        prisma.course.findMany({
          where: { professorId: id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, code: true, name: true, department: true,
            _count: { select: { enrollments: true, lectures: true, slots: true } },
          },
        }),
        prisma.lecture.findMany({
          where: { professorId: id },
          orderBy: { startsAt: 'desc' },
          take: 10,
          select: {
            id: true, title: true, startsAt: true, isOpen: true,
            course: { select: { code: true, name: true } },
            _count: { select: { attendances: true } },
          },
        }),
        prisma.resource.findMany({
          where: { course: { professorId: id } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true, originalName: true, kind: true, size: true, createdAt: true,
            course: { select: { code: true } },
          },
        }),
      ]);

      return Response.json({ professor: { ...professor, courses, lectures, resources } });
    }

    // ── قائمة الدكاترة مع بحث ──
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
    const professors = await prisma.user.findMany({
      where: {
        role: 'PROFESSOR',
        ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, isActive: true, approvedAt: true, createdAt: true,
        taughtCourses: { select: { code: true, name: true } },
      },
    });

    const counts = await prisma.lecture.groupBy({
      by: ['professorId'],
      where: { professorId: { in: professors.map((p) => p.id) } },
      _count: { _all: true },
    });
    const lecturesMap = new Map(counts.map((row) => [row.professorId, row._count._all]));

    const rows = professors.map(({ taughtCourses, ...rest }) => ({
      ...rest,
      courses: taughtCourses,
      lecturesCount: lecturesMap.get(rest.id) ?? 0,
    }));

    return Response.json({ rows });
  } catch (err) {
    return handleApiError(err, 'تعذر تحميل بيانات الدكاترة');
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const data = patchSchema.safeParse(await request.json());
    if (!data.success) {
      return jsonError(data.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    }
    const { id, name, ...rest } = data.data;

    const professor = await prisma.user.findFirst({ where: { id, role: 'PROFESSOR' } });
    if (!professor) return jsonError('الدكتور غير موجود', 404);

    const updates: Record<string, unknown> = {};
    if (rest.isActive !== undefined) {
      updates.isActive = rest.isActive;
      // أول تفعيل = موافقة الإدارة على حساب الدكتور
      if (rest.isActive && !professor.approvedAt) updates.approvedAt = new Date();
    }
    if (name !== undefined) updates.name = name;
    if (Object.keys(updates).length === 0) return jsonError('لا يوجد تغييرات', 400);

    const updated = await prisma.user.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, isActive: true },
    });
    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'ADMIN_PROF_UPDATE',
      entity: 'User',
      detail: { id, before: { name: professor.name, isActive: professor.isActive }, updates },
    });
    // تعطيل الحساب يجب أن يُبطل جلساته القائمة فورًا
    if (rest.isActive === false) {
      await prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return Response.json({ professor: updated });
  } catch (err) {
    return handleApiError(err, 'تعذر تحديث بيانات الدكتور');
  }
}