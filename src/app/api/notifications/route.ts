/**
 * 🔔 إشعارات المستخدم — GET: آخر 30 + عدد غير المقروء · POST: تعليم كمقروء
 */
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

const readSchema = z.object({
  ids: z.array(z.string().min(1)).max(50).optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);
    return Response.json({ items, unread }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = readSchema.safeParse(body ?? { all: true });
    if (!parsed.success) return jsonError('بيانات غير صالحة');

    if (parsed.data.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (parsed.data.ids?.length) {
      await prisma.notification.updateMany({
        where: { userId: user.id, id: { in: parsed.data.ids } },
        data: { readAt: new Date() },
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
