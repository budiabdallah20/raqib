import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';
import { assertRateLimit, handleApiError, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

const revokeSchema = z.object({
  sessionId: z.string().min(1).optional(),
  allOther: z.boolean().optional(),
}).refine((value) => Boolean(value.sessionId) !== Boolean(value.allOther), 'حدد جلسة واحدة أو كل الجلسات الأخرى');

export async function GET() {
  try {
    const current = await getCurrentSession();
    if (!current?.sessionId) return jsonError('غير مصرح', 401);
    const currentSessionId = current.sessionId;
    const sessions = await prisma.session.findMany({
      where: { userId: current.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    });
    return Response.json({
      sessions: sessions.map((session) => ({ ...session, current: session.id === currentSessionId })),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر عرض الجلسات');
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await getCurrentSession();
    if (!current?.sessionId) return jsonError('غير مصرح', 401);
    const currentSessionId = current.sessionId;
    assertRateLimit(`session-revoke:${current.user.id}`, 20, 15 * 60 * 1000, 'طلبات كثيرة — انتظر قليلًا');
    const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('بيانات الإلغاء غير صالحة', 400);
    if (parsed.data.sessionId === currentSessionId) {
      return jsonError('استخدم تسجيل الخروج لإغلاق الجلسة الحالية', 400);
    }
    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.session.updateMany({
        where: {
          userId: current.user.id,
          id: parsed.data.sessionId ? parsed.data.sessionId : { not: currentSessionId },
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });
      if (changed.count > 0) {
        await tx.auditLog.create({
          data: {
            userId: current.user.id, userRole: current.user.role,
            action: 'SESSION_REVOKE', entity: 'Session',
            detail: JSON.stringify({ count: changed.count, scope: parsed.data.allOther ? 'OTHER_SESSIONS' : 'ONE_SESSION' }),
          },
        });
      }
      return changed;
    });
    if (parsed.data.sessionId && result.count === 0) return jsonError('الجلسة غير موجودة', 404);
    return Response.json({ ok: true, revoked: result.count });
  } catch (error) {
    return handleApiError(error, 'تعذر إلغاء الجلسة');
  }
}
