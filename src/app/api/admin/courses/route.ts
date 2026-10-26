import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  code: z.string().trim().min(2, 'كود المقرر مطلوب').max(20),
  name: z.string().trim().min(2, 'اسم المقرر مطلوب').max(120),
  englishName: z.string().trim().max(120).optional().nullable(),
  professorId: z.string().min(1, 'اختر الدكتور المسؤول'),
  department: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  try {
    await requireUser(['ADMIN']);
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        englishName: true,
        department: true,
        createdAt: true,
        professor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, slots: true, lectures: true } },
      },
    });
    return Response.json({ courses });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const body = await request.json();
    const data = schema.safeParse(body);
    if (!data.success) {
      return jsonError(data.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    }
    const code = data.data.code.toUpperCase();
    const exists = await prisma.course.findUnique({ where: { code } });
    if (exists) return jsonError('كود المقرر مستخدم بالفعل', 409);
    const professor = await prisma.user.findUnique({ where: { id: data.data.professorId } });
    if (!professor || professor.role !== 'PROFESSOR') {
      return jsonError('الدكتور غير موجود', 404);
    }
    const course = await prisma.course.create({
      data: {
        code,
        name: data.data.name,
        englishName: data.data.englishName || null,
        professorId: data.data.professorId,
        department: data.data.department || undefined,
      },
      include: { professor: { select: { id: true, name: true } } },
    });
    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'COURSE_CREATE',
      entity: 'Course',
      detail: { id: course.id, code: course.code, name: course.name },
    });
    return Response.json(
      { course: { ...course, _count: { enrollments: 0, slots: 0, lectures: 0 } } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  englishName: z.string().trim().max(120).optional().nullable(),
  professorId: z.string().min(1).optional(),
  department: z.string().trim().max(120).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const body = await request.json();
    const data = patchSchema.safeParse(body);
    if (!data.success) return jsonError('بيانات غير صالحة', 400);
    const { id, professorId, ...rest } = data.data;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return jsonError('المقرر غير موجود', 404);
    if (professorId) {
      const professor = await prisma.user.findUnique({ where: { id: professorId } });
      if (!professor || professor.role !== 'PROFESSOR') {
        return jsonError('الدكتور غير موجود', 404);
      }
    }

    const updates: Record<string, unknown> = {};
    if (rest.name !== undefined) updates.name = rest.name;
    if (rest.englishName !== undefined) updates.englishName = rest.englishName || null;
    if (rest.department !== undefined) updates.department = rest.department || undefined;
    if (professorId) updates.professorId = professorId;
    if (Object.keys(updates).length === 0) return jsonError('لا يوجد تغييرات', 400);

    const updated = await prisma.course.update({
      where: { id },
      data: updates,
      include: { professor: { select: { id: true, name: true } } },
    });
    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'COURSE_UPDATE',
      entity: 'Course',
      detail: { id, before: { name: course.name, professorId: course.professorId }, updates },
    });
    return Response.json({ course: updated });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const body = await request.json();
    const data = deleteSchema.safeParse(body);
    if (!data.success) return jsonError('معرف المقرر مطلوب', 400);

    const course = await prisma.course.findUnique({
      where: { id: data.data.id },
      include: { _count: { select: { lectures: true, enrollments: true, slots: true } } },
    });
    if (!course) return jsonError('المقرر غير موجود', 404);
    const linked = course._count.lectures + course._count.enrollments + course._count.slots;
    if (linked > 0) return jsonError('المقرر مرتبط ببيانات أخرى', 409);

    await prisma.course.delete({ where: { id: course.id } });
    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'COURSE_DELETE',
      entity: 'Course',
      detail: { id: course.id, code: course.code, name: course.name },
    });
    return Response.json({ ok: true, id: course.id });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}