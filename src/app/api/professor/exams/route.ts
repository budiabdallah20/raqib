import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// GET /api/professor/exams — كل امتحاناتي مع عدادات
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['PROFESSOR']);
    const courses = await prisma.course.findMany({
      where: { professorId: user.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    const courseIds = courses.map((course) => course.id);
    const exams = await prisma.exam.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
        totalMarks: true,
        resultsVisible: true,
        createdAt: true,
        courseId: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });
    const courseMap = new Map(courses.map((course) => [course.id, course]));
    return Response.json({
      courses,
      exams: exams.map((exam) => ({
        ...exam,
        course: courseMap.get(exam.courseId) ?? null,
        questions: exam._count.questions,
        attempts: exam._count.attempts,
        _count: undefined,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الامتحانات');
  }
}

const createSchema = z.object({
  courseId: z.string().min(1, 'المقرر مطلوب'),
  title: z.string().trim().min(3, 'العنوان قصير جدًا').max(140),
  instructions: z.string().trim().max(2000).optional(),
  startsAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  endsAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  durationMinutes: z.number().int().min(5).max(240).default(60),
});

// ─────────────────────────────────────────────────────────────
// POST /api/professor/exams — إنشاء امتحان (DRAFT)
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    const { courseId, title, instructions, startsAt, endsAt, durationMinutes } = parsed.data;

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { professorId: true, code: true } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس من مقرراتك', 403);
    }
    const starts = startsAt ? new Date(startsAt) : null;
    const ends = endsAt ? new Date(endsAt) : null;
    if (starts && ends && ends <= starts) {
      return jsonError('موعد النهاية يجب أن يكون بعد البداية', 400);
    }

    const exam = await prisma.exam.create({
      data: {
        courseId,
        title,
        instructions: instructions || null,
        startsAt: starts,
        endsAt: ends,
        durationMinutes,
        createdById: user.id,
      },
      select: { id: true, title: true, status: true },
    });
    return Response.json({ ok: true, exam }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'تعذر إنشاء الامتحان');
  }
}
