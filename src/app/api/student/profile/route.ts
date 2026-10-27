import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';
import { GRADE_TOTAL_MAX, gpaPointFor, letterFor, totalOf } from '@/lib/grades';

// ───────────────────────────────────────────────────────────────
// GET /api/student/profile — كارت الطالب + المعدلات + منحنى التطور
// ───────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        avatarUrl: true,
        level: true,
        department: true,
        studentCode: true,
        group: true,
        email: true,
        phone: true,
        previousGpa: true,
        previousGpaSetAt: true,
        enrollments: {
          select: {
            course: {
              select: {
                code: true,
                name: true,
                creditHours: true,
                grades: {
                  where: { studentId: user.id },
                  select: { quiz: true, work: true, midterm: true, final: true },
                  take: 1,
                },
              },
            },
          },
        },
        gpaSnapshots: {
          orderBy: { createdAt: 'asc' },
          select: { term: true, gpa: true, credits: true },
        },
      },
    });
    if (!me) return jsonError('الحساب غير موجود', 404);

    const { enrollments, gpaSnapshots, ...meFields } = me;

    const courses = enrollments.map(({ course }) => {
      const grade = course.grades[0] ?? null;
      const graded =
        grade && (grade.quiz !== null || grade.work !== null || grade.midterm !== null || grade.final !== null);
      const total = grade ? totalOf(grade) : null;
      const creditHours = course.creditHours ?? 3;
      return {
        code: course.code,
        name: course.name,
        creditHours,
        total: graded ? total : null,
        letter: graded && total !== null ? letterFor(total) : null,
        gpaPoint: graded && total !== null ? gpaPointFor(total) : null,
        graded,
      };
    });

    const graded = courses.filter((course) => course.gpaPoint !== null);
    const gradedCredits = graded.reduce((sum, course) => sum + course.creditHours, 0);
    const creditTotal = courses.reduce((sum, course) => sum + course.creditHours, 0);
    const weighted = graded.reduce((sum, course) => sum + (course.gpaPoint ?? 0) * course.creditHours, 0);

    const termGpa = gradedCredits
      ? Math.round((weighted / gradedCredits) * 100) / 100
      : null;

    // التراكمي = المتوسط الموزون للترم السابق (المُدخل يدوياً) والترم الحالي
    let cumulativeGpa = termGpa;
    if (meFields.previousGpa !== null) {
      cumulativeGpa =
        termGpa !== null && gradedCredits
          ? Math.round(((meFields.previousGpa * creditTotal + termGpa * gradedCredits) / (creditTotal + gradedCredits)) * 100) / 100
          : meFields.previousGpa;
    }

    // منحنى التطور: لقطات الترمات السابقة + نقطة الترم الحالي
    const curve: { term: string; gpa: number | null }[] = gpaSnapshots.map((snapshot) => ({
      term: snapshot.term,
      gpa: Math.round(snapshot.gpa * 100) / 100,
    }));
    if (termGpa !== null) curve.push({ term: 'الحالي', gpa: termGpa });

    return Response.json({
      profile: {
        name: meFields.name,
        avatarUrl: meFields.avatarUrl,
        level: meFields.level,
        department: meFields.department,
        studentCode: meFields.studentCode,
        group: meFields.group,
        email: meFields.email,
        phone: meFields.phone,
      },
      gpa: {
        previous: meFields.previousGpa,
        previousSetAt: meFields.previousGpaSetAt ? meFields.previousGpaSetAt.toISOString() : null,
        term: termGpa,
        cumulative: cumulativeGpa,
        gradedCredits,
        creditTotal,
        maxTotal: GRADE_TOTAL_MAX,
      },
      courses,
      curve,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────────────
// POST /api/student/profile — إدخال المعدل السابق (مرة واحدة فقط)
// ───────────────────────────────────────────────────────────────
const previousGpaSchema = z.object({
  previousGpa: z
    .number()
    .min(0, 'المعدل لا يمكن أن يكون سالباً')
    .max(4, 'المعدل الأقصى 4.0'),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = previousGpaSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { previousGpaSetAt: true },
    });
    if (!me) return jsonError('الحساب غير موجود', 404);
    if (me.previousGpaSetAt) {
      return jsonError('تم إدخال المعدل السابق من قبل — لا يمكن تعديله', 409);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { previousGpa: parsed.data.previousGpa, previousGpaSetAt: new Date() },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'GPA_SET',
      entity: 'User',
      detail: { previousGpa: parsed.data.previousGpa },
    });

    return Response.json({ ok: true, previousGpa: parsed.data.previousGpa });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
