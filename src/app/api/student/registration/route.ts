import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, getClientIp } from '@/lib/security';
import { hashPii } from '@/lib/crypto';
import {
  DEFAULT_COURSE_CREDITS,
  DEFAULT_CREDIT_LIMIT,
  canAddCourse,
  creditsOf,
  findSlotConflicts,
  describeConflict,
  effectiveCandidateSlots,
  type GroupSlot,
} from '@/lib/enrollment';

export const dynamic = 'force-dynamic';

/** يستخرج الترم النشط بنفس منطق باقي البوابات (secondTermStart من AppSetting) */
async function resolveActiveTerm(now: Date) {
  const row = await prisma.appSetting.findUnique({ where: { key: 'secondTermStart' } });
  const second = row ? new Date(`${row.value}T00:00:00`) : null;
  return second && now >= second ? 'T2' : 'T1';
}

async function resolveCreditLimit(): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key: 'credit_limit' } });
  const limit = Number(row?.value);
  return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_CREDIT_LIMIT;
}

const enrollmentSelect = {
  id: true,
  status: true,
  createdAt: true,
  course: {
    select: {
      id: true,
      code: true,
      name: true,
      englishName: true,
      creditHours: true,
      professor: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────
// GET /api/student/registration — مقرراتي + المتاحة + الساعات + التعارضات
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);
    const now = new Date();
    const activeTerm = await resolveActiveTerm(now);
    const maxCredits = await resolveCreditLimit();

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { group: true, level: true, isActive: true },
    });
    if (!me?.isActive) return jsonError('الحساب غير مفعّل — راجع الأدمن', 403);
    const group = me.group || 'A';

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id, status: 'ACTIVE' },
      select: enrollmentSelect,
      orderBy: { createdAt: 'asc' },
    });
    const enrolledCourseIds = enrollments.map((item) => item.course.id);
    const enrolledCredits = creditsOf(enrollments.map((item) => item.course));

    // خانات الجدول في الترم النشط (كل الجروبات) — لتعارض المواعيد
    const allSlots = await prisma.scheduleSlot.findMany({
      where: { term: activeTerm },
      select: { day: true, period: true, courseId: true, group: true },
    });
    const mySlots = allSlots.filter(
      (slot) => slot.group === group && enrolledCourseIds.includes(slot.courseId),
    );
    const slotsByCourse = new Map<string, GroupSlot[]>();
    for (const slot of allSlots) {
      const list = slotsByCourse.get(slot.courseId) ?? [];
      list.push(slot);
      slotsByCourse.set(slot.courseId, list);
    }

    const availableRaw = await prisma.course.findMany({
      where: { id: { notIn: enrolledCourseIds } },
      select: {
        id: true,
        code: true,
        name: true,
        englishName: true,
        creditHours: true,
        professor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ code: 'asc' }],
    });

    const available = availableRaw.map((course) => {
      const allCandidateSlots = slotsByCourse.get(course.id) ?? [];
      // الطالب يحضر شعبة جروبه لو موجودة، وإلا الشعبة المتاحة (أي جروب)
      const effective = effectiveCandidateSlots(allCandidateSlots, group);
      const conflicts = findSlotConflicts(mySlots, effective, course.id);
      const credits = course.creditHours ?? DEFAULT_COURSE_CREDITS;
      const fits = canAddCourse(enrolledCredits, course, maxCredits);
      return {
        ...course,
        creditHours: credits,
        slots: allCandidateSlots.map(({ day, period, group: slotGroup }) => ({ day, period, group: slotGroup })),
        conflicts: conflicts.map((conflict) => ({
          ...conflict,
          label: describeConflict(conflict),
        })),
        canEnroll: conflicts.length === 0 && fits.ok,
        blockers: [
          ...(conflicts.length > 0 ? [`تعارض مواعيد: ${conflicts.map(describeConflict).join(' · ')}`] : []),
          ...(!fits.ok ? [fits.reason === 'CREDIT_LIMIT' ? fits.detail : 'غير مسموح'] : []),
        ],
      };
    });

    return Response.json({
      group,
      activeTerm,
      maxCredits,
      credits: {
        enrolled: enrolledCredits,
        max: maxCredits,
        remaining: Math.max(0, maxCredits - enrolledCredits),
      },
      enrolled: enrollments.map((item) => ({
        ...item.course,
        creditHours: item.course.creditHours ?? DEFAULT_COURSE_CREDITS,
        totalEnrolled: item.course._count.enrollments,
        createdAt: item.createdAt, // تاريخ التسجيل الفعلي (وليس تاريخ إنشاء المقرر)
      })),
      available,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل بيانات التسجيل');
  }
}

const postSchema = z.object({
  courseId: z.string().min(1, 'المقرر مطلوب'),
  action: z.enum(['enroll', 'drop']),
});

class RegistrationError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/student/registration — تسجيل/سحب داخل معاملة واحدة
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    const body = await request.json().catch(() => null);
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    const { courseId, action } = parsed.data;

    const now = new Date();
    const activeTerm = await resolveActiveTerm(now);
    const maxCredits = await resolveCreditLimit();

    const result = await prisma.$transaction(
      async (tx) => {
        const me = await tx.user.findUnique({
          where: { id: user.id },
          select: { group: true, isActive: true },
        });
        if (!me?.isActive) throw new RegistrationError('الحساب غير مفعّل — راجع الأدمن', 403);
        const group = me.group || 'A';

        const course = await tx.course.findUnique({
          where: { id: courseId },
          select: { id: true, code: true, name: true, creditHours: true },
        });
        if (!course) throw new RegistrationError('المقرر غير موجود', 404);

        const audit = (actionName: string, extra: Record<string, unknown>) =>
          tx.auditLog.create({
            data: {
              userId: user.id,
              userRole: 'STUDENT',
              action: actionName,
              entity: 'Enrollment',
              detail: JSON.stringify({ courseId: course.id, courseCode: course.code, ...extra }),
              ip: hashPii(getClientIp(request)),
              userAgent: request.headers.get('user-agent')?.slice(0, 256) ?? null,
            },
          });

        const existing = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
        });

        if (action === 'drop') {
          if (!existing || existing.status !== 'ACTIVE') {
            throw new RegistrationError('أنت غير مسجل في هذا المقرر', 404);
          }
          await tx.enrollment.update({
            where: { id: existing.id },
            data: { status: 'DROPPED' }, // نحتفظ بالسجل — لا حذف أبدًا (Rule 05)
          });
          await audit('ENROLLMENT_DROP', { previousStatus: 'ACTIVE' });
          const remainingEnrollments = await tx.enrollment.findMany({
            where: { studentId: user.id, status: 'ACTIVE' },
            select: { course: { select: { creditHours: true } } },
          });
          return { credits: creditsOf(remainingEnrollments.map((row) => row.course)) };
        }

        // ── التسجيل ──
        if (existing?.status === 'ACTIVE') {
          throw new RegistrationError('أنت مسجل في هذا المقرر بالفعل', 409);
        }

        const activeEnrollments = await tx.enrollment.findMany({
          where: { studentId: user.id, status: 'ACTIVE' },
          select: { course: { select: { id: true, creditHours: true } } },
        });
        const enrolledCourseIds = activeEnrollments.map((row) => row.course.id);
        const enrolledCredits = creditsOf(activeEnrollments.map((row) => row.course));

        const gate = canAddCourse(enrolledCredits, course, maxCredits);
        if (!gate.ok) throw new RegistrationError(gate.detail, 409);

        // تعارض المواعيد — يحضر شعبة جروبه لو موجودة وإلا الشعبة المتاحة لأي جروب
        const allCandidateSlots = await tx.scheduleSlot.findMany({
          where: { term: activeTerm, courseId: course.id },
          select: { day: true, period: true, courseId: true, group: true },
        });
        const mySlots = enrolledCourseIds.length === 0
          ? []
          : await tx.scheduleSlot.findMany({
              where: { group, term: activeTerm, courseId: { in: enrolledCourseIds } },
              select: { day: true, period: true, courseId: true, group: true },
            });
        const effective = effectiveCandidateSlots(allCandidateSlots, group);
        const conflicts = findSlotConflicts(mySlots, effective, course.id);
        if (conflicts.length > 0) {
          throw new RegistrationError(
            `تعارض في المواعيد: ${conflicts.map(describeConflict).join(' · ')}`,
            409,
          );
        }

        const semester = await tx.semester.findFirst({ where: { isCurrent: true }, select: { id: true } });
        if (existing) {
          await tx.enrollment.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', semesterId: semester?.id ?? existing.semesterId },
          });
        } else {
          await tx.enrollment.create({
            data: {
              studentId: user.id,
              courseId: course.id,
              status: 'ACTIVE',
              semesterId: semester?.id ?? null,
            },
          });
        }
        await audit(existing ? 'ENROLLMENT_REENABLE' : 'ENROLLMENT_ADD', {
          credits: course.creditHours ?? DEFAULT_COURSE_CREDITS,
        });
        const newCredits = creditsOf([
          ...activeEnrollments.map((row) => row.course),
          course,
        ]);
        return { credits: newCredits };
      },
      // ملاحظة صارمة: صحّة 17 ساعة محروسة بإعادة القراءة داخل المعاملة + القيد الفريد
      // على (studentId, courseId) — لا نعتمد على isolationLevel لأن SQLite لا يدعمه
      // ولا نريد مسارًا مختلفًا لكل dialect.
      { maxWait: 5_000, timeout: 10_000 },
    );

    return Response.json({
      ok: true,
      credits: { enrolled: result.credits, max: maxCredits, remaining: Math.max(0, maxCredits - result.credits) },
    });
  } catch (error) {
    if (error instanceof RegistrationError) return jsonError(error.message, error.status);
    // تعارض تسلسلي عند ضغط متزامن — نعطي رسالة مهذبة بدل 500 صامت
    if (error instanceof Error && /serialization|could not serialize/i.test(error.message)) {
      return jsonError('ضغط على طلبات متزامنة — حاول مرة أخرى', 409);
    }
    return handleApiError(error, 'تعذر تنفيذ عملية التسجيل');
  }
}
