/**
 * GET /api/health — فحص صحة التشغيل.
 * لا يعيد أي إحصاءات عن المستخدمين أو المحاضرات: كانت تكشف حجم القاعدة
 * ونشاط المنصة لأي زائر (reconnaissance). يكفي 200/503.
 */
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: 'ok', db: 'up' },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    // تفاصيل الخطأ تُسجَّل على السيرفر فقط — لا تحدث النص الخام لمتصفح مجهول
    console.error('[raqib:health] db check failed', error);
    return Response.json(
      { status: 'degraded', db: 'down' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
