/**
 * POST /api/admin/system/backup — نسخة احتياطية فورية (أدمن فقط).
 *  • SQLite: VACUUM INTO داخل prisma/backups + تنظيف آخر 20 نسخة (نفس منطق npm run db:backup).
 *  • Postgres (Vercel/Neon): تُنجز النسخ عبر سمتا بيئة النشر — يعيد رسالة واضحة بلا تشغيل خطر.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { jsonError, logAudit } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const KEEP = 20;

export async function POST(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const url = process.env.DATABASE_URL || '';
    const isPostgres = /^(postgres|postgresql):/i.test(url);

    if (isPostgres) {
      return jsonError('قاعدة الإنتاج السحابية تُنسخ احتياطيًا عبر خطة النشر — استخدم سكربت الطباعة المرتبط بخط الإنتاج', 501);
    }

    if (!url.startsWith('file:')) return jsonError('هذا المسار يدعم SQLite فقط (DATABASE_URL يبدأ بـ file:)', 400);
    const relative = url.slice('file:'.length).replace(/^\.\//, '');
    const dbPath = path.resolve(process.cwd(), 'prisma', relative);
    if (!fs.existsSync(dbPath)) return jsonError('ملف القاعدة غير موجود', 404);

    const outDir = path.resolve(process.cwd(), process.env.BACKUP_DIR || path.join('prisma', 'backups'));
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const target = path.join(outDir, `raqib-${stamp}.db`);

    try {
      const quoted = target.replace(/'/g, "''");
      await prisma.$executeRawUnsafe(`VACUUM INTO '${quoted}'`);
    } catch {
      // خطة بديلة: نسخ مباشر + ملفات WAL إن وُجدت
      fs.copyFileSync(dbPath, target);
      for (const suffix of ['-wal', '-shm']) {
        const side = `${dbPath}${suffix}`;
        if (fs.existsSync(side)) fs.copyFileSync(side, `${target}${suffix}`);
      }
    }

    if (!fs.existsSync(target)) return jsonError('فشل إنشاء النسخة الاحتياطية', 500);

    // تنظيف النسخ الأقدم من الحد المسموح
    const files = fs.readdirSync(outDir).filter((f) => /^raqib-.*\.db$/.test(f)).sort();
    const removed = files.slice(0, Math.max(0, files.length - KEEP));
    for (const old of removed) fs.unlinkSync(path.join(outDir, old));

    // آخر نسخة سابقة (قبل الجديدة) لعرضها في الواجهة
    const previous = files.filter((f) => f !== path.basename(target)).at(-1) ?? null;

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'DB_BACKUP_NOW',
      entity: 'System',
      detail: { name: path.basename(target), removedOld: removed.length },
    });

    return Response.json(
      {
        ok: true,
        backup: { name: path.basename(target), createdAt: new Date().toISOString() },
        previous,
        removedOld: removed.length,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as Error).message || 'تعذر النسخ الاحتياطي';
    return jsonError(message, status);
  }
}
