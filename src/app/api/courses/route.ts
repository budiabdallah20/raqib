import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { courseSchema, enrollSchema } from '@/lib/validations';
import { handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === 'ADMIN') {
      const courses = await prisma.course.findMany({
        include: {
          professor: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, lectures: true } },
        },
        orderBy: { code: 'asc' },
      });
      return Response.json({ courses });
    }
    if (user.role === 'PROFESSOR') {
      const courses = await prisma.course.findMany({
        where: { professorId: user.id },
        include: {
          _count: { select: { enrollments: true, lectures: true } },
        },
        orderBy: { code: 'asc' },
      });
      return Response.json({ courses });
    }
    const courses = await prisma.course.findMany({
      where: { enrollments: { some: { studentId: user.id } } },
      include: {
        professor: { select: { name: true } },
        _count: { select: { lectures: true } },
      },
      orderBy: { code: 'asc' },
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
    if (body.action === 'enroll') {
      const parsed = enrollSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const enrollment = await prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: parsed.data.studentId,
            courseId: parsed.data.courseId,
          },
        },
        update: {},
        create: parsed.data,
      });
      return Response.json({ enrollment });
    }

    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    const course = await prisma.course.create({
      data: {
        code: sanitizeString(parsed.data.code, 20).toUpperCase(),
        name: sanitizeString(parsed.data.name, 120),
        professorId: parsed.data.professorId,
        department: parsed.data.department
          ? sanitizeString(parsed.data.department, 80)
          : undefined,
      },
    });
    await logAudit({
      user,
      request,
      action: 'COURSE_CREATE',
      entity: 'Course',
      detail: { courseId: course.id, code: course.code },
    });
    return Response.json({ course });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
