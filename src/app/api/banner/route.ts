/**
 * شريط البث الطارئ (أدمن §6.7 — صف 1):
 * يقرأ AppSetting «emergency_banner» لحظيًا — يظهر فورًا في البوابات الثلاث.
 * قيمة فارغة/غير موجودة = لا يوجد بث (اختفاء هادئ).
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireUser();
    const row = await prisma.appSetting.findUnique({
      where: { key: 'emergency_banner' },
      select: { value: true },
    });
    const banner = row?.value?.trim() || null;
    return Response.json({ banner }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
