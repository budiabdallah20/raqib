import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, handleApiError, jsonError, logAudit } from '@/lib/security';
import { GRADE_TOTAL_MAX, gpaPointFor, letterFor, totalOf } from '@/lib/grades';

// ───────────────────────────────────────────────────────────────
// GET /api/student/profile — كارت الطالب + المعدلات + منحنى التطور + الترتيب
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
                id: true,
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

    // الصف المكتمل = كل مكونات الدرجة مسجلة — الصفوف الناقصة لا تدخل أي ترتيب
    type GradeRow = { quiz: number | null; work: number | null; midterm: number | null; final: number | null };
    const isCompleteRow = (row: GradeRow) =>
      row.quiz !== null && row.work !== null && row.midterm !== null && row.final !== null;

    // ── ترتيب الطالب داخل كل مقرر (على إجمالي مقياس 100) ──
    const courseIds = enrollments.map((item) => item.course.id);
    const courseGradeRows = courseIds.length
      ? await prisma.grade.findMany({
          where: { courseId: { in: courseIds } },
          select: { studentId: true, courseId: true, quiz: true, work: true, midterm: true, final: true },
        })
      : [];
    const byCourse = new Map<string, Map<string, number>>(); // courseId → (studentId → إجمالي)
    for (const row of courseGradeRows) {
      if (!isCompleteRow(row)) continue; // درجات ناقصة (بها null) لا تُحتسب ترتيباً
      let table = byCourse.get(row.courseId);
      if (!table) {
        table = new Map();
        byCourse.set(row.courseId, table);
      }
      table.set(row.studentId, totalOf(row));
    }
    const standingIn = (courseId: string): { rank: number | null; of: number } => {
      const table = byCourse.get(courseId);
      if (!table) return { rank: null, of: 0 };
      const myTotal = table.get(user.id);
      if (myTotal === undefined) return { rank: null, of: table.size };
      let higher = 0;
      for (const total of table.values()) if (total > myTotal) higher += 1;
      return { rank: higher + 1, of: table.size };
    };

    // ── الترتيب التراكمي على مستوى الفرقة: متوسط الإجمالي لكل طالب في الفرقة ──
    const levelAverages: { id: string; avg: number }[] = [];
    if (meFields.level) {
      const sameLevel = await prisma.user.findMany({
        where: { role: 'STUDENT', level: meFields.level, isActive: true },
        select: {
          id: true,
          grades: { select: { quiz: true, work: true, midterm: true, final: true } },
        },
      });
      for (const student of sameLevel) {
        const completeRows = student.grades.filter(isCompleteRow);
        if (!completeRows.length) continue; // طالب بلا درجات مكتملة لا يدخل الترتيب
        const avg = completeRows.reduce((sum, row) => sum + totalOf(row), 0) / completeRows.length;
        levelAverages.push({ id: student.id, avg });
      }
      levelAverages.sort((a, b) => b.avg - a.avg);
    }
    const levelIndex = levelAverages.findIndex((row) => row.id === user.id);
    const levelRank = levelIndex >= 0 ? { rank: levelIndex + 1, of: levelAverages.length } : null;

    const courses = enrollments.map(({ course }) => {
      const grade = course.grades[0] ?? null;
      const graded =
        grade && (grade.quiz !== null || grade.work !== null || grade.midterm !== null || grade.final !== null);
      // التقدير ونقطة GPA يتحددوا فقط عند اكتمال الدرجة (تسجيل الفاينل = آخر مكوّن)
      const complete =
        !!grade && grade.quiz !== null && grade.work !== null && grade.midterm !== null && grade.final !== null;
      const total = grade ? totalOf(grade) : null;
      const creditHours = course.creditHours ?? 3;
      const standing = standingIn(course.id);
      return {
        code: course.code,
        name: course.name,
        creditHours,
        components: grade
          ? { quiz: grade.quiz, work: grade.work, midterm: grade.midterm, final: grade.final }
          : null,
        total: graded ? total : null,
        letter: complete && total !== null ? letterFor(total) : null,
        gpaPoint: complete && total !== null ? gpaPointFor(total) : null,
        graded,
        complete,
        rank: standing.rank,
        rankOf: standing.of,
      };
    });

    const graded = courses.filter((course) => course.gpaPoint !== null);
    const gradedCredits = graded.reduce((sum, course) => sum + course.creditHours, 0);
    const creditTotal = courses.reduce((sum, course) => sum + course.creditHours, 0);
    const weighted = graded.reduce((sum, course) => sum + (course.gpaPoint ?? 0) * course.creditHours, 0);

    const termGpa = gradedCredits ? Math.round((weighted / gradedCredits) * 100) / 100 : null;

    // التراكمي = متوسط موزون للترمات السابقة + الترم الحالي.
    // أرصدة الترمات السابقة تأتي من لقطات GpaSnapshot المحفوظة (الأدق)؛
    // إن لم توجد لقطات والمعدل السابق مُدخل يدوياً نزنّه بأرصدة الترم الحالي المقيّم
    // (أو وزن 1 إن لم تُقيَّم أي درجة بعد) — ولا نخلط أبداً أرصدة مواد الترم الحالي
    // غير المقيّمة في وزن الترمات السابقة (كانت تُضاعَف خطأً).
    const pastTerms = gpaSnapshots.filter((snapshot) => snapshot.credits > 0);
    const pastWeighted = pastTerms.reduce((sum, snapshot) => sum + snapshot.gpa * snapshot.credits, 0);
    const pastCredits = pastTerms.reduce((sum, snapshot) => sum + snapshot.credits, 0);

    let prevWeighted = pastWeighted;
    let prevCredits = pastCredits;
    let cumulativeSource: 'snapshots' | 'previous' | null = pastCredits > 0 ? 'snapshots' : null;
    if (pastCredits === 0 && meFields.previousGpa !== null) {
      const weight = gradedCredits > 0 ? gradedCredits : 1;
      prevWeighted = meFields.previousGpa * weight;
      prevCredits = weight;
      cumulativeSource = 'previous';
    }

    const cumulativeParts = [
      ...(prevCredits > 0 ? [{ weighted: prevWeighted, credits: prevCredits }] : []),
      ...(termGpa !== null && gradedCredits > 0 ? [{ weighted: termGpa * gradedCredits, credits: gradedCredits }] : []),
    ];
    const cumulativeCredits = cumulativeParts.reduce((sum, part) => sum + part.credits, 0);
    const cumulativeWeighted = cumulativeParts.reduce((sum, part) => sum + part.weighted, 0);
    const cumulativeGpa =
      cumulativeCredits > 0 ? Math.round((cumulativeWeighted / cumulativeCredits) * 100) / 100 : null;
    // التراكمي = معدل الترم الحالي فقط (لا يوجد ترم سابق مسجل) — العميل يعرضه بهذه الصياغة الصادقة
    const cumulativeIsTermOnly = prevCredits === 0 && termGpa !== null;

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
        cumulativeIsTermOnly,
        cumulativeSource,
        gradedCredits,
        creditTotal,
        maxTotal: GRADE_TOTAL_MAX,
      },
      levelRank,
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
    assertRateLimit(`gpa-set:${user.id}`, 10, 60 * 60 * 1000);
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
