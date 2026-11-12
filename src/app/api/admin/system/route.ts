/**
 * GET /api/admin/system — مؤشرات الأنظمة الحية (أدمن فقط):
 *  • القاعدة: نوعها · الفحص · زمن الاستجابة · الحجم المستخدم
 *  • Drive: الوضع الحي · السعة المستخدمة مقابل الإجمالية
 * GET لا يفصح عن أي بيانات مستخدمين — مقاييس بنية فقط.
 */
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { jsonError } from '@/lib/security';
import { driveStorage } from '@/lib/drive';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SystemRow = {
  db: {
    dialect: 'postgres' | 'sqlite';
    up: boolean;
    latencyMs: number | null;
    sizeBytes: number | null;
    sizeNote: string | null;
  };
  drive: {
    configured: boolean;
    mode: 'rest' | 'rclone' | null;
    usedBytes: number | null;
    totalBytes: number | null;
  };
  generatedAt: string;
};

export async function GET(request: Request) {
  try {
    await requireUser(['ADMIN']);

    const url = process.env.DATABASE_URL || '';
    const isPostgres = /^(postgres|postgresql):/i.test(url);
    const dialect: 'postgres' | 'sqlite' = isPostgres ? 'postgres' : 'sqlite';

    // 1) الفحص + زمن الاستجابة الفعلي
    let up = false;
    let latencyMs: number | null = null;
    try {
      const startedAt = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
      up = true;
    } catch {
      up = false;
    }

    // 2) حجم القاعدة المستخدم
    let sizeBytes: number | null = null;
    let sizeNote: string | null = null;
    if (up && dialect === 'postgres') {
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ size: bigint | string | number }>>(
          'SELECT pg_database_size(current_database()) AS size',
        );
        const first = rows?.[0];
        sizeBytes = first ? Number(first.size) : null;
      } catch {
        sizeBytes = null;
        sizeNote = 'تعذر قياس الحجم من pg_database_size';
      }
    } else if (dialect === 'sqlite') {
      // SQLite: حجم ملف القاعدة من fs مباشرة (بلا pragma غير موثوق)
      sizeBytes = await sqliteFileBytes(url);
      sizeNote = null;
    }

    // 3) سعة Drive الحية
    const drive = await driveStorage();

    const payload: SystemRow = {
      db: {
        dialect,
        up,
        latencyMs,
        sizeBytes,
        sizeNote,
      },
      drive: {
        configured: drive.configured,
        mode: drive.mode,
        usedBytes: drive.usedBytes,
        totalBytes: drive.totalBytes,
      },
      generatedAt: new Date().toISOString(),
    };
    return Response.json(payload, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as Error).message || 'حدث خطأ غير متوقع';
    return jsonError(message, status);
  }
}

/** حجم ملف SQLite من DATABASE_URL (file:./dev.db) — عبر fs فقط، بلا متسرب */
async function sqliteFileBytes(url: string): Promise<number | null> {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    if (!url.startsWith('file:')) return null;
    const relative = url.slice('file:'.length).replace(/^\.\//, '');
    const dbPath = path.resolve(process.cwd(), 'prisma', relative);
    const stat = await fs.stat(dbPath);
    return stat.size;
  } catch {
    return null;
  }
}
