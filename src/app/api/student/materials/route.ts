/**
 * 🌐 ملفات مذكرة الطالب — ملفات المواد المسجل فيها فقط (PDF/مذكرة/شرح)
 * GET /api/student/materials
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            englishName: true,
            resources: {
              select: {
                id: true,
                originalName: true,
                storedName: true,
                mimeType: true,
                size: true,
                kind: true,
                createdAt: true,
                lecture: { select: { id: true, title: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { course: { code: 'asc' } },
    });

    const materials = enrollments
      .map(({ course }) => ({
        courseId: course.id,
        code: course.code,
        name: course.name,
        englishName: course.englishName,
        items: course.resources.map((resource) => ({
          id: resource.id,
          originalName: resource.originalName,
          url: `/api/files/resource/${resource.storedName}`,
          mimeType: resource.mimeType,
          size: resource.size,
          kind: resource.kind,
          createdAt: resource.createdAt,
          lecture: resource.lecture ? { id: resource.lecture.id, title: resource.lecture.title } : null,
        })),
      }))
      .filter((course) => course.items.length > 0);

    return Response.json(
      { materials },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل ملفات المقررات');
  }
}
