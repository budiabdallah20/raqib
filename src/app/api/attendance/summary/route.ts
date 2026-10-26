/**
 * ملخص حضور الطالب لكل مادة + سجل كامل — WP2
 * GET /api/attendance/summary (للطالب فقط)
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { computeStudentCourseStats, getPolicy, STATUS_LABEL } from '@/lib/attendance-policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);
    const policy = await getPolicy();

    const [lectures, records, enrollments] = await Promise.all([
      prisma.lecture.findMany({
        where: { course: { enrollments: { some: { studentId: user.id } } } },
        select: { id: true, courseId: true },
      }),
      prisma.attendance.findMany({
        where: { studentId: user.id },
        select: { lectureId: true, status: true, scannedAt: true, lecture: { select: { id: true, title: true, course: { select: { id: true, code: true } } } } },
      }),
      prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { courseId: true, course: { select: { id: true, code: true, name: true, englishName: true } } },
      }),
    ]);

    const lectureCourse = new Map(lectures.map((l) => [l.id, l.courseId]));
    const lecturesByCourse = new Map<string, number>();
    for (const l of lectures) lecturesByCourse.set(l.courseId, (lecturesByCourse.get(l.courseId) ?? 0) + 1);

    const byCourse = new Map<string, { present: number; late: number }>();
    for (const r of records) {
      const cid = lectureCourse.get(r.lectureId);
      if (!cid) continue;
      const c = byCourse.get(cid) ?? { present: 0, late: 0 };
      if (r.status === 'LATE') c.late += 1;
      else c.present += 1;
      byCourse.set(cid, c);
    }

    const summary = enrollments.map(({ course }) => {
      const c = byCourse.get(course.id) ?? { present: 0, late: 0 };
      const stats = computeStudentCourseStats(c.present, c.late, lecturesByCourse.get(course.id) ?? 0, policy);
      return {
        course: { id: course.id, code: course.code, name: course.name, englishName: course.englishName },
        ...stats,
        statusLabel: STATUS_LABEL[stats.status],
      };
    });

    return Response.json({
      policy,
      summary,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
