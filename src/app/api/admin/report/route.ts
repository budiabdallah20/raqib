/**
 * تقرير الكلية — للأدمن فقط (WP2)
 * GET /api/admin/report?format=json|csv
 * يعيد: ملخص كل مادة (الحضور المحسوب فعليًا) + توزيع الحالات + CSV.
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { csvCell, handleApiError, logAudit } from '@/lib/security';
import { getPolicy } from '@/lib/attendance-policy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';

    const policy = await getPolicy();
    const [courses, enrollmentCounters, attendanceByCourse] = await Promise.all([
      prisma.course.findMany({
        select: {
          id: true, code: true, name: true, englishName: true,
          professor: { select: { name: true } },
          _count: { select: { enrollments: true, lectures: true } },
        },
        orderBy: { code: 'asc' },
      }),
      prisma.enrollment.groupBy({
        by: ['courseId'],
        _count: true,
      }),
      prisma.attendance.findMany({
        select: { status: true, lecture: { select: { courseId: true } } },
      }),
    ]);

    const courseRows = courses.map((c) => {
      const rows = attendanceByCourse.filter((a) => a.lecture.courseId === c.id);
      const present = rows.filter((r) => r.status === 'PRESENT').length;
      const late = rows.filter((r) => r.status === 'LATE').length;
      const seats = enrollmentCounters.find((e) => e.courseId === c.id)?._count ?? 0;
      const lectures = c._count.lectures;
      const possible = seats * lectures;
      // الحضور المحسوب فعليًا = (حاضر + 0.5·متأخر) / (محاضرات × مسجلين)
      const pct = possible > 0
        ? Math.round(((present + 0.5 * late) / possible) * 1000) / 10
        : 0;
      return {
        id: c.id, code: c.code, name: c.name,
        professor: c.professor.name,
        seats, lectures,
        present, late,
        attendancePct: pct,
        health: pct >= policy.attendanceThreshold ? 'SAFE' : pct > 0 ? 'WARNING' : 'EMPTY',
      };
    });

    const totals = {
      courses: courseRows.length,
      seats: courseRows.reduce((s, c) => s + c.seats, 0),
      lectures: courseRows.reduce((s, c) => s + c.lectures, 0),
      attendancePct: courseRows.length > 0
        ? Math.round((courseRows.reduce((s, c) => s + c.attendancePct, 0) / courseRows.length) * 10) / 10
        : 0,
      belowThreshold: courseRows.filter((c) => c.attendancePct < policy.attendanceThreshold && c.attendancePct > 0).length,
    };

    if (format === 'csv') {
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'REPORT_EXPORT_CSV',
        entity: 'Course',
        detail: { report: 'college', courses: courseRows.length },
      });

      const lines = [
        `تقرير الكلية — سياسة الحضور: ${policy.attendanceThreshold}% · حرمان عند ${policy.maxAbsence}%`,
        '',
        'كود المادة,المادة,الدكتور,مسجلون,محاضرات,حاضر,متأخر,النسبة %',
        ...courseRows.map((r) =>
          [
            r.code, r.name, r.professor, r.seats, r.lectures, r.present, r.late, r.attendancePct,
          ]
            .map(csvCell)
            .join(','),
        ),
      ];
      const csv = '\uFEFF' + lines.join('\n');
      return new Response(csv, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="raqib-college-report.csv"',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    return Response.json({
      policy,
      totals,
      courses: courseRows,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إنشاء تقرير الكلية');
  }
}
