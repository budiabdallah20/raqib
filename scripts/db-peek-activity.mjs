/** مؤقت: آخر الجلسات وسجل التدقيق — لمصدر دعم نشاط العصر أثناء الترحيل */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' }, take: 5,
    select: { id: true, ip: true, userAgent: true, createdAt: true, revokedAt: true, user: { select: { email: true } } },
  });
  for (const s of sessions) {
    console.log(`${s.createdAt.toISOString()}  ip=${s.ip ?? '-'}  ua=${(s.userAgent ?? '-').slice(0, 50)}  user=${s.user?.email ?? '-'} revoked=${!!s.revokedAt}`);
  }
  console.log('--- AUDIT ---');
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' }, take: 6,
    select: { action: true, entity: true, createdAt: true, ip: true },
  });
  for (const l of logs) console.log(`${l.createdAt.toISOString()}  ${l.action}  ${l.entity}  ip=${l.ip ?? '-'}`);
} finally {
  await prisma.$disconnect();
}
