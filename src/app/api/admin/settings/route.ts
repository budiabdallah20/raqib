import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';
import { QR_ROTATE_PRESETS } from '@/lib/constants';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = [
  'secondTermStart',
  'firstTermEnd',
  'platformStatus',
  'qr_rotation_seconds',
  'emergency_banner',
  // PHASE 1: configurable enrollment cap. Default '17' is seeded by backfill.
  'credit_limit',
  // نموذج مخاطر التعثر الحتمي — أوزان قابلة للضبط من الأدمن (تُطبّع داخل المحرك)
  'risk_w_attendance',
  'risk_w_grade',
  'risk_w_task',
] as const;

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string().max(400),
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
    const data = patchSchema.safeParse(await request.json().catch(() => null));
    if (!data.success) return jsonError('بيانات غير صالحة', 400);
    const { key, value } = data.data;

    if (!(ALLOWED_KEYS as readonly string[]).includes(key)) {
      return jsonError('مفتاح الإعداد غير مسموح', 400);
    }
    // مفاتيح التواريخ تُسقَم ISO، وplatformStatus قيمة معدودة ONLINE | MAINTENANCE،
    // وqr_rotation_seconds أحد الأنماط المسموحة 5/10/15/20، وemergency_banner نص حر يسمح بالفراغ (لإطفاء البث)
    let stored = value;
    if (key === 'platformStatus') {
      if (value !== 'ONLINE' && value !== 'MAINTENANCE') {
        return jsonError('حالة المنصة يجب أن تكون ONLINE أو MAINTENANCE', 400);
      }
    } else if (key === 'qr_rotation_seconds') {
      if (!(QR_ROTATE_PRESETS as readonly number[]).map(String).includes(value)) {
        return jsonError('مدة دوران QR يجب أن تكون إحدى القيم 5 أو 10 أو 15 أو 20 ثانية', 400);
      }
    } else if (key === 'emergency_banner') {
      stored = sanitizeString(value, 300);
    } else if (key.startsWith('risk_w_')) {
      // وزن بنسبة 0..1 — المجموع لا يشترط أن = 1 (المحرك يطبّعه)
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0 || num > 1) {
        return jsonError('الوزن يجب أن يكون رقمًا بين 0 و 1', 400);
      }
      stored = String(Math.round(num * 100) / 100);
    } else if (!isValidIsoDate(value)) {
      return jsonError('التاريخ غير صالح — استخدم صيغة YYYY-MM-DD', 400);
    }

    const before = await prisma.appSetting.findUnique({ where: { key } });
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value: stored },
      create: { key, value: stored },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'SETTINGS_UPDATE',
      entity: 'AppSetting',
      detail: { key, before: before?.value ?? null, after: stored },
    });

    return Response.json({ setting });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}