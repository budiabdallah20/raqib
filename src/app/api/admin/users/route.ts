import { prisma } from '@/lib/db';
import { hashPassword, requireUser } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations';
import { handleApiError, jsonError, sanitizeString } from '@/lib/security';

export async function GET() {
  try {
    await requireUser(['ADMIN']);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentCode: true,
        createdAt: true,
        _count: { select: { enrollments: true, taughtCourses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Response.json({ users });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(['ADMIN']);
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }

    const email = parsed.data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return jsonError('البريد مستخدم مسبقاً', 409);

    const user = await prisma.user.create({
      data: {
        name: sanitizeString(parsed.data.name, 80),
        email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
        studentCode: parsed.data.studentCode
          ? sanitizeString(parsed.data.studentCode, 20)
          : null,
        enrollments: parsed.data.courseIds?.length
          ? {
              create: parsed.data.courseIds.map((courseId) => ({ courseId })),
            }
          : undefined,
      },
    });
    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
      },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
