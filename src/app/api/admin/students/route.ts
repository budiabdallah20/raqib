import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit, sanitizeString, normalizePhone } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LEVELS = ['1', '2', '3', '4'];
const GROUPS = ['A', 'B'];

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  level: z.string().trim().max(4).optional(),
  group: z.string().trim().max(2).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  group: z.enum(['A', 'B']).optional().nullable(),
  level: z.enum(['1', '2', '3', '4']).optional().nullable(),
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(20).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    await requireUser(['ADMIN']);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // ── تفاصيل طالب واحد ──
    if (id) {
      const student = await prisma.user.findFirst({
        where: { id, role: 'STUDENT' },
        select: {
          id: true, name: true, email: true, phone: true, studentCode: true,
          group: true, level: true, gender: true, nationalId: true, birthDate: true,
          avatarUrl: true, isActive: true, createdAt: true,
          enrollments: {
            orderBy: { createdAt: 'desc' },
            select: { course: { select: { id: true, code: true, name: true, professor: { select: { name: true } } } } },
          },
          grades: {
            orderBy: { updatedAt: 'desc' },
            select: {
              quiz: true, work: true, midterm: true, updatedAt: true,
              course: { select: { code: true, name: true } },
            },
          },
          attendances: {
            orderBy: { scannedAt: 'desc' },
            take: 10,
            select: {
              status: true, scannedAt: true,
              lecture: { select: { title: true, course: { select: { code: true } } } },
            },
          },
        },
      });
      if (!student) return jsonError('الطالب غير موجود', 404);

      const courseIds = student.enrollments.map((e) => e.course.id);
      const [attendedCount, lectureGroups] = await Promise.all([
        prisma.attendance.count({ where: { studentId: id, lecture: { courseId: { in: courseIds } } } }),
        prisma.lecture.groupBy({
          by: ['courseId'],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
        }),
      ]);
      const possible = lectureGroups.reduce((sum, row) => sum + row._count._all, 0);
      const attendancePct = possible > 0 ? Math.round((attendedCount / possible) * 100) : null;

      return Response.json({ student: { ...student, attendancePct, attendedCount, possibleLectures: possible } });
    }

    // ── قائمة الطلاب مع بحث وفلاتر وتقسيم صفحات ──
    const parsed = listQuery.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('معاملات غير صالحة', 400);
    const { q, level, group, page = 1, pageSize = 10 } = parsed.data;

    const where: Record<string, unknown> = { role: 'STUDENT' };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { studentCode: { contains: q } },
        { phone: { contains: normalizePhone(q) } },
      ];
    }
    if (level) where.level = level;
    if (group) where.group = group;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, name: true, studentCode: true, email: true, phone: true,
          group: true, level: true, isActive: true, avatarUrl: true, createdAt: true,
          enrollments: { select: { course: { select: { code: true } } } },
        },
      }),
    ]);

    const rows = users.map(({ enrollments, ...rest }) => ({
      ...rest,
      coursesCount: enrollments.length,
      courses: enrollments.map((e) => ({ code: e.course.code })),
    }));

    return Response.json({ rows, total, page, pageSize });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const body = await request.json();
    const data = patchSchema.safeParse(body);
    if (!data.success) {
      return jsonError(data.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    }
    const { id, phone, ...rest } = data.data;

    const student = await prisma.user.findFirst({ where: { id, role: 'STUDENT' } });
    if (!student) return jsonError('الطالب غير موجود', 404);

    const updates: Record<string, unknown> = {};
    if (rest.isActive !== undefined) updates.isActive = rest.isActive;
    if (rest.group !== undefined) updates.group = rest.group;
    if (rest.level !== undefined) updates.level = rest.level;
    if (rest.name !== undefined) updates.name = sanitizeString(rest.name, 120);
    if (phone !== undefined) {
      const normalized = phone ? normalizePhone(String(phone)) : '';
      if (normalized) {
        const dup = await prisma.user.findFirst({ where: { phone: normalized, id: { not: id } } });
        if (dup) return jsonError('رقم الهاتف مستخدم من حساب آخر', 409);
        updates.phone = normalized;
      } else {
        updates.phone = null;
      }
    }
    if (Object.keys(updates).length === 0) return jsonError('لا يوجد تغييرات', 400);

    const updated = await prisma.user.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, isActive: true, group: true, level: true, phone: true },
    });
    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'ADMIN_STUDENT_UPDATE',
      entity: 'User',
      detail: { id, before: { isActive: student.isActive, group: student.group, level: student.level, name: student.name, phone: student.phone }, updates },
    });
    return Response.json({ student: updated });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}