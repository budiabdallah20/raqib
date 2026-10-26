/**
 * إعادة ضبط بيانات العرض — للأدمن فقط (WP1)
 * يشغّل سكربت seed-demo (fresh) في عملية منفصلة ويعيد التقرير عند الانهاء.
 * محمي بـ rate limit + Zod + AuditLog.
 */
import { spawn } from 'node:child_process';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, handleApiError, jsonError, logAudit } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** عملية مدمّرة: لازم تتفتح صراحة من البيئة، وممنوعة تمامًا في الإنتاج */
function demoResetEnabled() {
  return (
    process.env.ALLOW_DEMO_RESET === '1' && process.env.NODE_ENV !== 'production'
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);

    if (!demoResetEnabled()) {
      return jsonError('إعادة ضبط الديمو غير مفعّلة على هذا السيرفر', 403);
    }
    // استدعاء واحد كل 3 دقائق — ما مرهقة القاعدة
    assertRateLimit(`demo-reset:${user.id}`, 1, 3 * 60 * 1000, 'انتظر 3 دقائق قبل إعادة الضبط مرة أخرى');

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'DEMO_RESET',
      entity: 'AppSetting',
      detail: { via: 'admin-dashboard' },
    });

    const started = Date.now();
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'prisma/seed-demo.ts', '--fresh'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'ignore',
        windowsHide: true,
      });
      const timer = setTimeout(() => reject(new Error('نفدت مهلة إعادة الضبط (5 دقائق)')), 5 * 60 * 1000);
      child.on('exit', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`فشل سكربت الديمو (رمز ${code})`));
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const completed = new Date();
    await prisma.appSetting.upsert({
      where: { key: 'demoSeededAt' },
      update: { value: completed.toISOString() },
      create: { key: 'demoSeededAt', value: completed.toISOString() },
    });

    return Response.json({
      ok: true,
      seconds: Math.round((Date.now() - started) / 1000),
      seededAt: completed.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إعادة ضبط بيانات الديمو');
  }
}
