import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getPolicy } from '@/lib/attendance-policy';
import { GRADE_MAX } from '@/lib/grades';
import { computeRiskScore, normalizeWeights, type RiskBand } from '@/lib/risk';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// GET /api/professor/at-risk           → نظرة عامة على كل مقررات الدكتور
// GET /api/professor/at-risk?courseId=… → تفاصيل الطلاب + درجة الخطر الحتمية
// ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();

    const courses = await prisma.course.findMany({
      where: { professorId: user.id },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    if (courses.length === 0) {
      return Response.json({ mode: courseId ? 'detail' : 'overview', courses: [], summary: { safe: 0, watch: 0, critical: 0 }, rows: [] });
    }

    if (courseId) {
      const owned = courses.find((c) => c.id === courseId);
      if (!owned) return jsonError('هذا المقرر ليس من مقرراتك', 403);
      const ctx = await buildContext();
      const detail = await buildDetail(owned, ctx);
      return Response.json({ mode: 'detail' as const, ...detail });
    }

    const ctx = await buildContext();
    const overview = [];
    for (const course of courses) {
      const detail = await buildDetail(course, ctx);
      overview.push({
        courseId: course.id,
        code: course.code,
        name: course.name,
        enrolled: detail.rows.length,
        safe: detail.summary.safe,
        watch: detail.summary.watch,
        critical: detail.summary.critical,
        avgScore:
          detail.rows.length > 0
            ? Math.round(detail.rows.reduce((sum, row) => sum + row.risk.score, 0) / detail.rows.length)
            : 0,
      });
    }
    return Response.json({ mode: 'overview' as const, courses: overview });
  } catch (error) {
    return handleApiError(error, 'تعذر حساب لوحة المخاطر');
  }
}

type Context = {
  policy: Awaited<ReturnType<typeof getPolicy>>;
  weights: ReturnType<typeof normalizeWeights>;
};

/** السياسة + أوزان المخاطر (من AppSetting لو ضبطها الأدمن) — تُقرأ مرة واحدة */
async function buildContext(): Promise<Context> {
  const policy = await getPolicy();
  const weightRows = await prisma.appSetting.findMany({
    where: { key: { in: ['risk_w_attendance', 'risk_w_grade', 'risk_w_task'] } },
  });
  const weightMap = new Map(weightRows.map((row) => [row.key, Number(row.value)]));
  const weights = normalizeWeights({
    attendance: weightMap.get('risk_w_attendance'),
    grade: weightMap.get('risk_w_grade'),
    task: weightMap.get('risk_w_task'),
  });
  return { policy, weights };
}

/** يبني تفاصيل الخطر لمقرر واحد — استعلامات مجمّعة بدون N+1 */
async function buildDetail(course: { id: string; code: string; name: string }, ctx: Context) {
  const now = new Date();
  const { policy, weights } = ctx;

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    select: {
      studentId: true,
      student: {
        select: { id: true, name: true, studentCode: true, group: true, level: true },
      },
    },
  });
  const studentIds = enrollments.map((item) => item.studentId);

  // محاضرات المقرر الماضية وغير الملغاة — المقام العادل للحضور
  const pastLectures = await prisma.lecture.count({
    where: { courseId: course.id, startsAt: { lt: now }, cancelledAt: null },
  });

  const [presentRows, lateRows, grades, dueTasks, submissions] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds }, status: 'PRESENT', lecture: { courseId: course.id, startsAt: { lt: now }, cancelledAt: null } },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds }, status: 'LATE', lecture: { courseId: course.id, startsAt: { lt: now }, cancelledAt: null } },
      _count: { _all: true },
    }),
    prisma.grade.findMany({
      where: { studentId: { in: studentIds }, courseId: course.id },
      select: { studentId: true, quiz: true, work: true, midterm: true },
    }),
    prisma.task.findMany({
      where: { courseId: course.id, deadline: { lt: now } },
      select: { id: true },
    }),
    prisma.taskSubmission.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        task: { courseId: course.id, deadline: { lt: now } },
      },
      _count: { _all: true },
    }),
  ]);

  const presentMap = new Map(presentRows.map((row) => [row.studentId, row._count._all]));
  const lateMap = new Map(lateRows.map((row) => [row.studentId, row._count._all]));
  const gradeMap = new Map(grades.map((row) => [row.studentId, row]));
  const submissionMap = new Map(submissions.map((row) => [row.studentId, row._count._all]));
  const tasksDue = dueTasks.length;

  const rows = enrollments.map(({ studentId, student }) => {
    const present = presentMap.get(studentId) ?? 0;
    const late = lateMap.get(studentId) ?? 0;
    const attendancePct =
      pastLectures > 0
        ? Math.round(((present + late * policy.lateCountsAs) / pastLectures) * 1000) / 10
        : null;

    const grade = gradeMap.get(studentId) ?? null;
    const hasAnyComponent =
      grade !== null && (grade.quiz !== null || grade.work !== null || grade.midterm !== null);
    const gradeCurrent = hasAnyComponent
      ? (grade!.quiz ?? 0) + (grade!.work ?? 0) + (grade!.midterm ?? 0)
      : null;
    const gradeEnteredMax =
      grade === null
        ? 0
        : (grade.quiz !== null ? GRADE_MAX.QUIZ : 0) +
          (grade.work !== null ? GRADE_MAX.WORK : 0) +
          (grade.midterm !== null ? GRADE_MAX.MIDTERM : 0);

    const tasksMissed = Math.max(0, tasksDue - (submissionMap.get(studentId) ?? 0));

    const risk = computeRiskScore(
      { attendancePct, gradeCurrent, gradeEnteredMax, tasksDue, tasksMissed },
      weights,
    );

    return {
      id: student.id,
      name: student.name,
      studentCode: student.studentCode,
      group: student.group,
      level: student.level,
      attendance: {
        present,
        late,
        pastLectures,
        pct: attendancePct,
      },
      grade: {
        current: gradeCurrent === null ? null : Math.round(gradeCurrent * 10) / 10,
        enteredMax: gradeEnteredMax,
        quiz: grade?.quiz ?? null,
        work: grade?.work ?? null,
        midterm: grade?.midterm ?? null,
      },
      tasks: { due: tasksDue, missed: tasksMissed },
      risk: {
        score: risk.score,
        band: risk.band as RiskBand,
        components: risk.components,
        reasons: risk.reasons,
      },
    };
  });

  rows.sort((a, b) => b.risk.score - a.risk.score);

  const summary = rows.reduce(
    (acc, row) => {
      if (row.risk.band === 'SAFE') acc.safe += 1;
      else if (row.risk.band === 'WATCH') acc.watch += 1;
      else acc.critical += 1;
      return acc;
    },
    { safe: 0, watch: 0, critical: 0 },
  );

  return {
    course: { id: course.id, code: course.code, name: course.name },
    policy: { threshold: policy.attendanceThreshold, lateCountsAs: policy.lateCountsAs },
    weights,
    rows,
    summary,
  };
}
