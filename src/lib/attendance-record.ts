import { prisma } from '@/lib/db';
import { computeStudentCourseStats, getPolicy, STATUS_LABEL } from '@/lib/attendance-policy';
import { notifyUsers } from '@/lib/notify';

/**
 * سجل الحضور الواحد — تستخدمه /api/attendance و /api/attendance/scan
 * يعالج: التسجيل في المقرر، ممنوعة التكرار، تحديد الحالة (حاضر/متأخر) بالسياسة،
 * التدقيق، والتنبيه الذكي عند الهبوط تحت عتبة الحضور (WP4).
 */

export type RecordAttendanceResult =
  | {
      kind: 'forbidden';
      code: 'NOT_ENROLLED';
      message: string;
      lecture: { id: string; title: string; courseName: string; courseCode: string };
    }
  | {
      kind: 'duplicate';
      message: string;
      attendance: {
        id: string;
        lectureId: string;
        studentId: string;
        status: string;
        scannedAt: Date;
      };
      lecture: { id: string; title: string; courseName: string; courseCode: string };
    }
  | {
      kind: 'created';
      message: string;
      attendance: {
        id: string;
        lectureId: string;
        studentId: string;
        status: string;
        scannedAt: Date;
      };
      lecture: { id: string; title: string; courseName: string; courseCode: string };
    };

type LectureWithCourse = {
  id: string;
  courseId: string;
  title: string;
  startsAt: Date | null;
  course: { name: string; code: string };
};

const lectureBase = (lecture: LectureWithCourse) => ({
  id: lecture.id,
  title: lecture.title,
  courseName: lecture.course.name,
  courseCode: lecture.course.code,
});

export async function recordAttendance(params: {
  studentId: string;
  lecture: LectureWithCourse;
  /** طريقة التسجيل: رمز قاعدة/hex، الكود اليدوي، أو توكن QR الموقّع المتجدد */
  via: 'QR' | 'MANUAL' | 'QR_JWT';
  /** تسجيلة تدقيق مكتملة (IP/UA ضمنها المتصل) */
  audit: (detail: Record<string, unknown>) => Promise<unknown>;
}): Promise<RecordAttendanceResult> {
  const { studentId, lecture, via, audit } = params;

  const enrolled = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: lecture.courseId },
    },
  });
  if (!enrolled || enrolled.status !== 'ACTIVE') {
    return {
      kind: 'forbidden',
      code: 'NOT_ENROLLED',
      message: 'أنت غير مسجل في هذا المقرر',
      lecture: lectureBase(lecture),
    };
  }

  const late =
    lecture.startsAt && Date.now() - lecture.startsAt.getTime() > 20 * 60 * 1000;
  const status = late ? 'LATE' : 'PRESENT';

  const existing = await prisma.attendance.findUnique({
    where: {
      lectureId_studentId: { lectureId: lecture.id, studentId },
    },
  });
  if (existing) {
    // منع المسح المكرر — حالة واضحة بدل الرفض الصامت
    return {
      kind: 'duplicate',
      message: 'تم تسجيل حضورك في هذه المحاضرة بالفعل',
      attendance: existing,
      lecture: lectureBase(lecture),
    };
  }

  const attendance = await prisma.attendance.create({
    data: {
      lectureId: lecture.id,
      studentId,
      status,
    },
  });

  await audit({
    lectureId: lecture.id,
    lectureTitle: lecture.title,
    course: lecture.course.code,
    status,
    via,
  });

  // إنذار غياب تلقائي (WP4): إن هبط الطالب تحت العتبة في المادة
  try {
    const policy = await getPolicy();
    const [courseLectures, myAtts] = await Promise.all([
      prisma.lecture.count({ where: { courseId: lecture.courseId } }),
      prisma.attendance.findMany({
        where: { studentId, lecture: { courseId: lecture.courseId } },
        select: { status: true },
      }),
    ]);
    const present = myAtts.filter((a) => a.status === 'PRESENT').length;
    const lateCount = myAtts.filter((a) => a.status === 'LATE').length;
    const stats = computeStudentCourseStats(present, lateCount, courseLectures, policy);
    if (stats.status === 'DENIED') {
      const alreadyAlerted = await prisma.notification.findFirst({
        where: {
          userId: studentId,
          kind: 'ALERT',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (!alreadyAlerted) {
        await notifyUsers({
          userIds: [studentId],
          title: '⚠️ تحذير حرمان في الحضور',
          body: `نسبتك في ${lecture.course.code} أصبحت ${stats.attendancePct}% — تحت الحد (${policy.attendanceThreshold}%). حالة: ${STATUS_LABEL.DENIED}. راجع تعليمات الكلية.`,
          kind: 'ALERT',
          link: '/student/attendance',
          email: true,
        });
      }
    }
  } catch {
    /* الإشعار الواعي لا يكسر المسح أبدًا */
  }

  return {
    kind: 'created',
    message: 'تم تسجيل حضورك بنجاح',
    attendance,
    lecture: lectureBase(lecture),
  };
}
