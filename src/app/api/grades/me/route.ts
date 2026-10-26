import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';

// ───────────────────────────────────────────────────────
// GET /api/grades/me — كل درجات الطالب مع كود واسم المقرر
// مرتبة حسب كود المقرر والإجمالي محسوب
// ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const grades = await prisma.grade.findMany({
      where: { studentId: user.id },
      select: {
        quiz: true,
        work: true,
        midterm: true,
        updatedAt: true,
        course: { select: { code: true, name: true } },
      },
    });

    grades.sort((a, b) => a.course.code.localeCompare(b.course.code));

    return Response.json({
      grades: grades.map((grade) => ({
        course: { code: grade.course.code, name: grade.course.name },
        quiz: grade.quiz,
        work: grade.work,
        midterm: grade.midterm,
        total: (grade.quiz ?? 0) + (grade.work ?? 0) + (grade.midterm ?? 0),
      })),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
