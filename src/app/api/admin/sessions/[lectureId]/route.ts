import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

type StudentLite = {
  id: string;
  name: string;
  studentCode: string | null;
};

/**
 * GET /api/admin/sessions/:lectureId — تفكيم أسماء جلسة محاضرة واحدة (أدمن فقط).
 * يُعيد: بيانات الجلسة + الحاضرون + الغائبون + المعذورون — من القاعدة الحية فقط.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lectureId: string }> },
) {
  try {
    await requireUser(['ADMIN']);
    const { lectureId } = await params;

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true,
        title: true,
        location: true,
        startsAt: true,
        isOpen: true,
        cancelledAt: true,
        course: {
          select: {
            code: true,
            name: true,
            enrollments: {
              select: { student: { select: { id: true, name: true, studentCode: true } } },
            },
          },
        },
        attendances: {
          select: { studentId: true, status: true, scannedAt: true },
        },
      },
    });

    if (!lecture) return jsonError('المحاضرة غير موجودة', 404);

    const attendedMap = new Map(lecture.attendances.map((a) => [a.studentId, a]));
    const present: StudentLite[] = [];
    const absent: StudentLite[] = [];
    const excused: Array<StudentLite & { scannedAt: string }> = [];

    for (const enrollment of lecture.course.enrollments) {
      const student = enrollment.student;
      const record = attendedMap.get(student.id);
      const lite = {
        id: student.id,
        name: student.name,
        studentCode: student.studentCode,
      };
      if (!record) {
        absent.push(lite);
      } else if (record.status === 'EXCUSED') {
        excused.push({ ...lite, scannedAt: record.scannedAt.toISOString() });
      } else {
        present.push(lite);
      }
    }

    return Response.json(
      {
        lecture: {
          id: lecture.id,
          title: lecture.title,
          location: lecture.location,
          startsAt: lecture.startsAt.toISOString(),
          isOpen: lecture.isOpen,
          cancelled: lecture.cancelledAt !== null,
          courseCode: lecture.course.code,
          courseName: lecture.course.name,
          enrolled: lecture.course.enrollments.length,
        },
        present,
        absent,
        excused,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    const message = (err as Error).message || 'حدث خطأ غير متوقع';
    return jsonError(message, status);
  }
}
