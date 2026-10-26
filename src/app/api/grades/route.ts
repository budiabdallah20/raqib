import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';

// كل مكون من مكونات الدرجة (كويز / أعمال / ميدترم) من 0 إلى 60
const MAX_COMPONENT = 60;

const componentSchema = z
  .number()
  .min(0, 'الدرجة لا يمكن أن تكون سالبة')
  .max(MAX_COMPONENT, `الدرجة يجب أن تكون بين 0 و ${MAX_COMPONENT}`)
  .nullable();

const rowSchema = z.object({
  studentId: z.string().min(1),
  quiz: componentSchema.optional(),
  work: componentSchema.optional(),
  midterm: componentSchema.optional(),
});

const putSchema = z.object({
  courseId: z.string().min(1, 'المقرر مطلوب'),
  rows: z.array(rowSchema).min(1, 'لا توجد درجات لحفظها').max(200),
});

// ───────────────────────────────────────────────────────
// GET /api/grades?courseId=… — جدول درجات مقررٍ يخص الدكتور فقط
// ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();
    if (!courseId) return jsonError('حدد المقرر المطلوب');

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            studentCode: true,
            group: true,
            grades: {
              where: { courseId },
              select: { quiz: true, work: true, midterm: true },
              take: 1,
            },
          },
        },
      },
    });

    const students = enrollments
      .map(({ student }) => {
        const grade = student.grades[0] || null;
        return {
          id: student.id,
          name: student.name,
          studentCode: student.studentCode,
          group: student.group,
          grade: grade
            ? { quiz: grade.quiz, work: grade.work, midterm: grade.midterm }
            : null,
        };
      })
      .sort((a, b) => (a.studentCode || '').localeCompare(b.studentCode || ''));

    return Response.json({
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        englishName: course.englishName,
      },
      students,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────
// PUT /api/grades — حفظ صفوف درجات (صف واحد أو كل الصفوف)
// ───────────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }
    const { courseId, rows } = parsed.data;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    // عزل بيانات صارم: لا تُحفظ درجة إلا لطالب منسجل فعليًا في المقرر
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    });
    const allowed = new Set(enrollments.map((e) => e.studentId));
    const validRows = rows.filter((row) => allowed.has(row.studentId));
    const dropped = rows.length - validRows.length;

    let updated = 0;
    for (const row of validRows) {
      const data: { quiz?: number | null; work?: number | null; midterm?: number | null } = {};
      if (row.quiz !== undefined) data.quiz = row.quiz;
      if (row.work !== undefined) data.work = row.work;
      if (row.midterm !== undefined) data.midterm = row.midterm;

      await prisma.grade.upsert({
        where: {
          studentId_courseId: { studentId: row.studentId, courseId },
        },
        update: data,
        create: { studentId: row.studentId, courseId, ...data },
      });
      updated += 1;
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'GRADE_EDIT',
      entity: 'Grade',
      detail: { courseId, courseCode: course.code, updated, dropped, reason: dropped ? 'طلاب غير مسجلين' : undefined },
    });

    return Response.json({ ok: true, updated, dropped });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
