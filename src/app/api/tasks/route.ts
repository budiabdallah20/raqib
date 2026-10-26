import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';
import {
  TASK_DIR,
  TASK_NAME_RE,
  fileExists,
  safePath,
  verifyUploadSignature,
} from '@/lib/storage';

// ───────────────────────────────────────────────────────
// GET /api/tasks — مهام مقررات الطالب مع تسليمه الخاص
// ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((item) => item.courseId);

    const tasks = courseIds.length
      ? await prisma.task.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { deadline: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            kind: true,
            deadline: true,
            requiresFile: true,
            status: true,
            course: { select: { name: true, code: true } },
            submissions: {
              where: { studentId: user.id },
              take: 1,
              select: {
                fileUrl: true,
                submittedAt: true,
                score: true,
                feedback: true,
              },
            },
          },
        })
      : [];

    return Response.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        kind: task.kind,
        deadline: task.deadline.toISOString(),
        requiresFile: task.requiresFile,
        status: task.status,
        course: task.course,
        submission: task.submissions[0]
          ? {
              fileUrl: task.submissions[0].fileUrl,
              submittedAt: task.submissions[0].submittedAt.toISOString(),
              score: task.submissions[0].score,
              feedback: task.submissions[0].feedback,
            }
          : null,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل المهام');
  }
}

// ───────────────────────────────────────────────────────
// POST /api/tasks — تسليم الطالب لمهمة (upsert التسليم)
// { taskId, fileUrl? } — الطالب يسلم بنفس جلسته فقط
// ───────────────────────────────────────────────────────
const submitSchema = z.object({
  taskId: z.string().trim().min(1, 'معرّف المهمة مطلوب'),
  fileUrl: z.string().trim().min(1).max(300).optional().or(z.literal('')),
  // توقيع HMAC يُصدره /api/upload/task — يثبت أن الملف رفعه نفس الطالب
  uploadToken: z.string().trim().max(64).optional().or(z.literal('')),
});

/** يستخرج اسم الملف من رابط التسليم ويتحقق من صيغته */
function storedNameFromUrl(fileUrl: string) {
  const match = /^\/api\/files\/task\/([^/?#]+)$/.exec(fileUrl);
  if (!match) return null;
  return TASK_NAME_RE.test(match[1]) ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(
      `task-submit:${user.id}`,
      15,
      15 * 60 * 1000,
      'محاولات تسليم كثيرة. انتظر قليلًا ثم حاول مرة أخرى',
    );

    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }

    const { taskId } = parsed.data;

    // لا نقبل أي رابط إلا ملفًا رفعه هذا الطالب عبر /api/upload/task،
    // وإلا أمكن تسليم ملف شخص آخر أو رابط خارجي.
    let fileUrl: string | null = null;
    const incomingUrl = parsed.data.fileUrl || '';
    if (incomingUrl) {
      const storedName = storedNameFromUrl(incomingUrl);
      if (!storedName) return jsonError('رابط الملف غير صالح', 400);
      if (
        !verifyUploadSignature(
          user.id,
          storedName,
          parsed.data.uploadToken || null,
        )
      ) {
        return jsonError('تعذر التحقق من ملكية الملف المرفوع', 403);
      }
      const fullPath = safePath(TASK_DIR, storedName, TASK_NAME_RE);
      if (!(await fileExists(fullPath))) {
        return jsonError('الملف المرفوع غير موجود، أعد رفعه', 400);
      }
      fileUrl = `/api/files/task/${storedName}`;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        requiresFile: true,
        status: true,
        deadline: true,
        courseId: true,
      },
    });
    if (!task) return jsonError('المهمة غير موجودة', 404);
    if (task.status !== 'OPEN') return jsonError('المهمة مغلقة', 403);
    if (task.deadline.getTime() <= Date.now()) {
      return jsonError('انتهت المدة', 403);
    }

    const enrolled = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: user.id, courseId: task.courseId },
      },
      select: { id: true },
    });
    if (!enrolled) {
      return jsonError('لا يمكنك تسليم مهمة لمقرر غير مسجل عليه', 403);
    }

    // إعادة التسليم بدون ملف جديد تحتفظ بالملف السابق بدل مسحه
    const hasNewFile = Boolean(fileUrl);
    if (!fileUrl) {
      const existing = await prisma.taskSubmission.findUnique({
        where: { taskId_studentId: { taskId, studentId: user.id } },
        select: { fileUrl: true },
      });
      fileUrl = existing?.fileUrl ?? null;
    }
    if (task.requiresFile && !fileUrl) {
      return jsonError('هذه المهمة تتطلب رفع ملف الحل', 400);
    }

    const now = new Date();
    const submission = await prisma.taskSubmission.upsert({
      where: { taskId_studentId: { taskId, studentId: user.id } },
      create: { taskId, studentId: user.id, fileUrl },
      update: {
        ...(hasNewFile ? { fileUrl } : {}),
        submittedAt: now,
      },
      select: {
        fileUrl: true,
        submittedAt: true,
        score: true,
        feedback: true,
      },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'TASK_SUBMIT',
      entity: 'TaskSubmission',
      detail: { taskId, fileUrl },
    });

    return Response.json({
      ok: true,
      submission: {
        ...submission,
        submittedAt: submission.submittedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تسليم المهمة');
  }
}
