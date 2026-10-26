/**
 * GET /api/health — فحص صحة التشغيل (لا يمس بيانات حساسة)
 * يعيد 200 فقط عند نجاح الاتصال بالقاعدة + إحصاءات تشغيلية عامة.
 */
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [users, openLectures] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.lecture.count({ where: { isOpen: true } }),
    ]);
    return Response.json({
      status: 'ok',
      db: 'up',
      users,
      openLectures,
      ms: Date.now() - started,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: 'degraded', db: 'down', error: (error as Error).message.slice(0, 120), time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
