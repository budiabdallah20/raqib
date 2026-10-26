import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  action: z.string().trim().max(60).optional(),
  entity: z.string().trim().max(60).optional(),
  role: z.string().trim().max(20).optional(),
});

export async function GET(request: Request) {
  try {
    await requireUser(['ADMIN']);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return jsonError('معاملات غير صالحة', 400);
    const { page = 1, pageSize = 50, action, entity, role } = parsed.data;

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action.toUpperCase() };
    if (entity) where.entity = { contains: entity };
    if (role) where.userRole = role.toUpperCase();

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, userId: true, userRole: true, action: true, entity: true,
          detail: true, ip: true, userAgent: true, createdAt: true,
        },
      }),
    ]);

    return Response.json({ rows, total, page, pageSize });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}