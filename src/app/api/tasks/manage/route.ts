import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';
import { notifyUsers } from '@/lib/notify';

// ── setContentView أدوات مشتركة ──
const titleSchema = z.string().trim().min(3, 'العنوان قصير جدًا').max(120, 'العنوان طويل جدًا');
const descriptionSchema = z.string().trim().max(2000, 'الوصف طويل جدًا').optional().or(z.literal(''));

const postSchema = z.object({
  courseId: z.string().min(1, 'المقرر مطلوب'),
  title: titleSchema,
  description: descriptionSchema,
  kind: z.enum(['WEEKLY', 'MONTHLY'], { message: 'نوع التاسك غير صحيح' }),
  deadline: z.coerce.date(),
  requiresFile: z.boolean().default(false),
});

const patchSchema = z.object({
  taskId: z.string().min(1),
  action: z.enum(['close', 'reopen', 'delete']),
});

const scoreRowSchema = z.object({
  studentId: z.string().min(1),
  score: z.number().min(0, 'الدرجة لا تكون سالبة').max(100, 'الدرجة تصل حتى 100'),
  feedback: z.string().trim().max(500, 'التعليق طويل جدًا').optional().or(z.literal('')),
});

const putSchema = z.object({
  taskId: z.string().min(1),
  rows: z.array(scoreRowSchema).min(1, 'لا توجد درجات لحفظها').max(200),
});

// يرمي خطأً بناتج status عند المشكلات — يستخدمه try/catch في كل handler
async function loadOwnedTask(professorId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { course: { select: { id: true, professorId: true, code: true, name: true } } },
  });
  if (!task) {
    const err = new Error('المهمة غير موجودة');
    (err as Error & { status: number }).status = 404;
    throw err;
  }
  if (task.course.professorId !== professorId) {
    const err = new Error('هذه المهمة ليست ضمن مقرراتك');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return task;
}

// ───────────────────────────────────────────────────────
// GET /api/tasks/manage?courseId=… — مهام الدكتور لمقرراته
// ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.professorId !== user.id) {
        return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
      }
    }

    const tasks = await prisma.task.findMany({
      where: { courseId: courseId || undefined, course: { professorId: user.id } },
      include: {
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { submissions: true } },
        submissions: {
          select: {
            id: true,
            studentId: true,
            fileUrl: true,
            submittedAt: true,
            score: true,
            feedback: true,
            student: { select: { name: true, studentCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return Response.json({ tasks });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────
// POST /api/tasks/manage — إنشاء تاسك جديد
// ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }
    const { courseId, title, description, kind, deadline, requiresFile } = parsed.data;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }
    // الموعد النهائي لازم يكون في المستقبل
    if (deadline.getTime() <= Date.now()) {
      return jsonError('الموعد النهائي لازم يكون تاريخ في المستقبل');
    }

    const task = await prisma.task.create({
      data: {
        title: sanitizeString(title, 120),
        description: description ? sanitizeString(description, 2000) : null,
        kind,
        deadline,
        requiresFile,
        status: 'OPEN',
        courseId,
        createdById: user.id,
      },
      include: { course: { select: { id: true, code: true, name: true } } },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'TASK_CREATE',
      entity: 'Task',
      detail: { taskId: task.id, title: task.title, courseId, kind, deadline: deadline.toISOString() },
    });

    // إشعار الطلاب المسجلين بتاسك جديد (WP4)
    const enrolled = await prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    });
    await notifyUsers({
      userIds: enrolled.map((e) => e.studentId),
      title: 'تاسك جديد',
      body: `${task.course.code}: ${task.title} — التسليم موعده ${deadline.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}.`,
      kind: 'TASK',
      link: '/student/tasks',
      email: kind === 'MONTHLY',
    });

    return Response.json({ task });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────
// PATCH /api/tasks/manage — إغلاق / إعادة فتح / حذف تاسك
// ───────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }
    const { taskId, action } = parsed.data;

    const task = await loadOwnedTask(user.id, taskId);

    if (action === 'delete') {
      await prisma.task.delete({ where: { id: task.id } });
    } else {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: action === 'close' ? 'CLOSED' : 'OPEN' },
      });
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: `TASK_${action.toUpperCase()}`,
      entity: 'Task',
      detail: { taskId, title: task.title, courseId: task.courseId },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────
// PUT /api/tasks/manage — تقييم تسليم واحد أو أكثر (0..100)
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
    const { taskId, rows } = parsed.data;

    const task = await loadOwnedTask(user.id, taskId);

    let graded = 0;
    for (const row of rows) {
      const feedback = row.feedback ? sanitizeString(row.feedback, 500) : null;
      await prisma.taskSubmission.upsert({
        where: { taskId_studentId: { taskId, studentId: row.studentId } },
        update: { score: row.score, feedback },
        // إن لم يكن هناك تسليم ملف، ننشئ سجل تقييم مباشر (تقييم يدوي)
        create: { taskId, studentId: row.studentId, score: row.score, feedback },
      });
      graded += 1;
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'TASK_GRADE',
      entity: 'TaskSubmission',
      detail: { taskId, title: task.title, graded },
    });

    return Response.json({ ok: true, graded });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
