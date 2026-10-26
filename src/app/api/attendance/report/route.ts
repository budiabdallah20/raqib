/**
 * تقرير حضور مادة — للأدمن/صاحب المادة فقط (WP2)
 * GET /api/attendance/report?courseId=…&format=json|csv
 * CSV يحتوي BOM حتى تظهر العربية سليمة في Excel.
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { csvCell, handleApiError, jsonError, logAudit } from '@/lib/security';
import { computeStudentCourseStats, getPolicy, STATUS_LABEL } from '@/lib/attendance-policy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();
    const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
    if (!courseId) return jsonError('حدد المقرر المطلوب');

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true, name: true, englishName: true, professorId: true },
    });
    if (!course) return jsonError('المقرر غير موجود', 404);
    if (user.role !== 'ADMIN' && course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    const policy = await getPolicy();
    const [enrollments, lectures, attendances] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId },
        select: {
          student: { select: { id: true, name: true, studentCode: true, group: true, level: true } },
        },
      }),
      prisma.lecture.findMany({ where: { courseId }, select: { id: true } }),
      prisma.attendance.findMany({
        where: { lecture: { courseId } },
        select: { lectureId: true, studentId: true, status: true },
      }),
    ]);

    const lecturesCount = lectures.length;
    const byStudent = new Map<string, { present: number; late: number }>();
    for (const a of attendances) {
      const c = byStudent.get(a.studentId) ?? { present: 0, late: 0 };
      if (a.status === 'LATE') c.late += 1;
      else c.present += 1;
      byStudent.set(a.studentId, c);
    }

    const rows = enrollments
      .map(({ student }) => {
        const c = byStudent.get(student.id) ?? { present: 0, late: 0 };
        const stats = computeStudentCourseStats(c.present, c.late, lecturesCount, policy);
        return {
          studentId: student.id,
          name: student.name,
          studentCode: student.studentCode ?? '—',
          group: student.group ?? '—',
          level: student.level ?? '—',
          present: stats.present,
          late: stats.late,
          absent: Math.max(0, stats.totalLectures - stats.present - stats.late),
          attendancePct: stats.attendancePct,
          status: stats.status,
          statusLabel: STATUS_LABEL[stats.status],
        };
      })
      .sort((a, b) => (a.studentCode || '').localeCompare(b.studentCode || ''));

    const meta = {
      course: { id: course.id, code: course.code, name: course.name, englishName: course.englishName },
      lecturesCount,
      policy,
      stats: {
        attendedTotal: attendances.length,
        seats: enrollments.length,
        avgPct: rows.length
          ? Math.round((rows.reduce((s, r) => s + r.attendancePct, 0) / rows.length) * 10) / 10
          : 0,
        denied: rows.filter((r) => r.status === 'DENIED').length,
        warning: rows.filter((r) => r.status === 'WARNING').length,
      },
    };

    if (format === 'csv') {
      // AuditLog لكل تصدير
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'REPORT_EXPORT_CSV',
        entity: 'Course',
        detail: { courseId, courseCode: course.code, rows: rows.length },
      });

      const head = ['كود الطالب', 'الاسم', 'الفرقة', 'الجروب', 'حاضر', 'متأخر', 'غائب', 'المجموع', 'النسبة %', 'الحالة'];
      const lines = [
        csvCell(`تقرير حضور مادة: ${course.code} — ${course.name}`),
        csvCell(`عدد المحاضرات: ${lecturesCount} — سياسة: حاضر ≥ ${policy.attendanceThreshold}% / حرمان عند غياب > ${policy.maxAbsence}%`),
        '',
        head.map(csvCell).join(','),
        ...rows.map((r) =>
          [r.studentCode, r.name, r.level, r.group, r.present, r.late, r.absent, lecturesCount, r.attendancePct, r.statusLabel]
            .map(csvCell)
            .join(','),
        ),
      ];
      // BOM \uFEFF ليفتح الاتيل بالعربي صح
      const csv = '\uFEFF' + lines.join('\n');
      return new Response(csv, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="attendance-${course.code.replace(/[^\w.-]/g, '')}.csv"`,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    return Response.json({ ...meta, rows }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إنشاء تقرير الحضور');
  }
}
