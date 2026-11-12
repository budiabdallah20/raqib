import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/security';
import { getPolicy, gradeStatus } from '@/lib/attendance-policy';
import { GRADE_MAX, GRADE_TOTAL_MAX, letterFor, totalOf, zoneFor } from '@/lib/grades';
import { computeRiskScore, type RiskBand } from '@/lib/risk';

export const dynamic = 'force-dynamic';

/**
 * GET /api/student/compass — «بوصلة المقررات»
 * بطاقة موقف واحدة لكل مقرر مسجّل: حضور، درجات، خطر التعثر، والمستقبل المتوقع.
 * حتمي 100% — لا بيانات خارج الخادم.
 */
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);
    const now = new Date();
    const policy = await getPolicy();

    const creditLimitSetting = await prisma.appSetting.findUnique({ where: { key: 'credit_limit' } });
    const creditLimit = Number(creditLimitSetting?.value);
    const maxCredits = Number.isFinite(creditLimit) && creditLimit > 0 ? creditLimit : 17;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id, status: 'ACTIVE' },
      select: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            creditHours: true,
            professor: { select: { name: true } },
          },
        },
      },
    });
    const courses = enrollments.map((item) => item.course);
    const courseIds = courses.map((course) => course.id);

    const [lectureCounts, grades, tasks, submissions] = await Promise.all([
      // محاضرات المقرر: الإجمالي (الأساس لحساب الساعات)
      prisma.lecture.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      }),
      prisma.grade.findMany({
        where: { studentId: user.id, courseId: { in: courseIds } },
        select: { courseId: true, quiz: true, work: true, midterm: true, final: true },
      }),
      prisma.task.findMany({
        where: { courseId: { in: courseIds }, deadline: { lt: now } },
        select: { id: true, courseId: true },
      }),
      prisma.taskSubmission.findMany({
        where: { studentId: user.id, task: { courseId: { in: courseIds }, deadline: { lt: now } } },
        select: { taskId: true },
      }),
    ]);

    // الحضور عبر المحاضرة — Attendance لا يملك courseId مباشرة
    const attendedRows = await prisma.attendance.findMany({
      where: {
        studentId: user.id,
        lecture: { courseId: { in: courseIds }, startsAt: { lt: now }, cancelledAt: null, isOpen: false },
      },
      select: { status: true, lecture: { select: { courseId: true } } },
    });

    const pastLectureRows = await prisma.lecture.findMany({
      where: { courseId: { in: courseIds }, startsAt: { lt: now }, cancelledAt: null, isOpen: false },
      select: { courseId: true },
    });
    const pastByCourse = new Map<string, number>();
    for (const row of pastLectureRows) {
      pastByCourse.set(row.courseId, (pastByCourse.get(row.courseId) ?? 0) + 1);
    }
    const totalByCourse = new Map(lectureCounts.map((row) => [row.courseId, row._count._all]));

    const attendanceMap = new Map<string, { present: number; late: number }>();
    for (const row of attendedRows) {
      const courseId = row.lecture.courseId;
      const current = attendanceMap.get(courseId) ?? { present: 0, late: 0 };
      if (row.status === 'PRESENT') current.present += 1;
      else if (row.status === 'LATE') current.late += 1;
      attendanceMap.set(courseId, current);
    }

    const gradeMap = new Map(grades.map((row) => [row.courseId, row]));
    const submittedTaskIds = new Set(submissions.map((row) => row.taskId));
    const tasksByCourse = new Map<string, { due: number; missed: number }>();
    for (const task of tasks) {
      const current = tasksByCourse.get(task.courseId) ?? { due: 0, missed: 0 };
      current.due += 1;
      if (!submittedTaskIds.has(task.id)) current.missed += 1;
      tasksByCourse.set(task.courseId, current);
    }

    const enrolledCredits = courses.reduce((sum, course) => sum + (course.creditHours ?? 3), 0);

    const result = courses.map((course) => {
      const past = pastByCourse.get(course.id) ?? 0;
      const total = totalByCourse.get(course.id) ?? 0;
      const attendance = attendanceMap.get(course.id) ?? { present: 0, late: 0 };
      const attendancePct =
        past > 0
          ? Math.round(((attendance.present + attendance.late * policy.lateCountsAs) / past) * 1000) / 10
          : null;
      const attendanceStatus = attendancePct === null ? 'SAFE' : gradeStatus(attendancePct, policy);

      const grade = gradeMap.get(course.id) ?? null;
      const hasComponent =
        grade !== null && (grade.quiz !== null || grade.work !== null || grade.midterm !== null);
      const enteredMax = hasComponent
        ? (grade!.quiz !== null ? GRADE_MAX.QUIZ : 0) +
          (grade!.work !== null ? GRADE_MAX.WORK : 0) +
          (grade!.midterm !== null ? GRADE_MAX.MIDTERM : 0)
        : 0;
      const gradeCurrent = hasComponent
        ? (grade!.quiz ?? 0) + (grade!.work ?? 0) + (grade!.midterm ?? 0)
        : null;
      const totalScore =
        grade && (hasComponent || grade.final !== null) ? totalOf(grade) : null;
      const letter = totalScore !== null ? letterFor(totalScore) : null;
      const zone = zoneFor(totalScore);

      const taskStats = tasksByCourse.get(course.id) ?? { due: 0, missed: 0 };
      const risk = computeRiskScore({
        attendancePct,
        gradeCurrent,
        gradeEnteredMax: enteredMax,
        tasksDue: taskStats.due,
        tasksMissed: taskStats.missed,
      });

      // نصيحة عملية واحدة مبنية على أضعف إشارة
      let advice = 'وضعك مستقر — حافظ على نفس الإيقاع.';
      if (attendanceStatus === 'DENIED') advice = 'تجاوزت حد الغياب — تواصل مع الدكتور فورًا.';
      else if (attendanceStatus === 'WARNING') advice = 'حضورك تحت العتبة — لا تتأخر عن محاضرة واحدة كمان.';
      else if (taskStats.missed > 0) advice = `سلّم ${taskStats.missed} تاسك فات موعدها — درجاتها بترجع لك.`;
      else if (gradeCurrent !== null && enteredMax > 0 && gradeCurrent < enteredMax * 0.6)
        advice = 'درجاتك تحت الإيقاع المتوقع — راجع محاضرات المقرر واطلب من الدكتور ملزمة.';

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        professor: course.professor.name,
        creditHours: course.creditHours ?? 3,
        lectures: { total, past },
        attendance: {
          present: attendance.present,
          late: attendance.late,
          pct: attendancePct,
          status: attendanceStatus,
        },
        grade: {
          quiz: grade?.quiz ?? null,
          work: grade?.work ?? null,
          midterm: grade?.midterm ?? null,
          final: grade?.final ?? null,
          total: totalScore,
          letter,
          zone,
          enteredMax,
          current: gradeCurrent === null ? null : Math.round(gradeCurrent * 10) / 10,
        },
        tasks: taskStats,
        risk: {
          score: risk.score,
          band: risk.band as RiskBand,
          reasons: risk.reasons,
        },
        advice,
      };
    });

    // الأخطر أولًا — البوصلة توجّه العين للحرج أولًا
    result.sort((a, b) => b.risk.score - a.risk.score);

    const summary = result.reduce(
      (acc, course) => {
        if (course.risk.band === 'SAFE') acc.safe += 1;
        else if (course.risk.band === 'WATCH') acc.watch += 1;
        else acc.critical += 1;
        return acc;
      },
      { safe: 0, watch: 0, critical: 0 },
    );

    return Response.json({
      credits: { enrolled: enrolledCredits, max: maxCredits },
      totalCourses: result.length,
      summary,
      maxTotal: GRADE_TOTAL_MAX,
      courses: result,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر حساب بوصلة المقررات');
  }
}
