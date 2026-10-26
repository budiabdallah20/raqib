import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * تقوية SQLite: تفعيل المفاتيح الأجنبية، WAL للقراءة المتزامنة،
 * و busy_timeout لتقليل أخطاء القفل تحت الضغط.
 */
async function hardenSqlite() {
  if (!process.env.DATABASE_URL?.startsWith('file:')) return;
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys=ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
  } catch (error) {
    console.error('[raqib:db] Failed to apply SQLite hardening pragmas', error);
  }
}

void hardenSqlite();
