import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit } from '@/lib/security';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = ['secondTermStart', 'firstTermEnd'] as const;

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export async function GET() {
  try {
    await requireUser(['ADMIN']);
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: ALLOWED_KEYS as unknown as string[] } },
      orderBy: { key: 'asc' },
    });
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    return Response.json({ settings, rows });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

function isValidIsoDate(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const data = patchSchema.safeParse(await request.json());
    if (!data.success) return jsonError('بيانات غير صالحة', 400);
    const { key, value } = data.data;

    if (!(ALLOWED_KEYS as readonly string[]).includes(key)) {
      return jsonError('مفتاح الإعداد غير مسموح', 400);
    }
    if (!isValidIsoDate(value)) {
      return jsonError('التاريخ غير صالح — استخدم صيغة YYYY-MM-DD', 400);
    }

    const before = await prisma.appSetting.findUnique({ where: { key } });
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'SETTINGS_UPDATE',
      entity: 'AppSetting',
      detail: { key, before: before?.value ?? null, after: value },
    });

    return Response.json({ setting });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}