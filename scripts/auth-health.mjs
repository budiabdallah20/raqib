/**
 * فحص صحة الدخول — كود الأدمن + حالة الحسابات في قاعدة البيانات.
 *   node scripts/auth-health.mjs
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const hash = (process.env.ADMIN_ACCESS_CODE_HASH || '')
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/\\\$/g, '$');
const plain = process.env.ADMIN_ACCESS_CODE || '';

console.log('--- كود الإدارة ---');
console.log('hash موجود:', Boolean(hash));
console.log('كود صريح في .env:', plain ? `${plain.slice(0, 4)}••••••••${plain.slice(-4)}` : '(لا يوجد)');
if (hash && plain) {
  const ok = await bcrypt.compare(plain, hash);
  console.log('الكود الصريح يطابق الـ hash:', ok ? '✅ نعم' : '❌ لا');
}

console.log('\n--- الحسابات في القاعدة ---');
const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, role: true, email: true, phone: true,
      studentCode: true, isActive: true, approvedAt: true,
      failedLoginAttempts: true, lockedUntil: true, createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (!users.length) console.log('(لا يوجد مستخدمون)');
  for (const u of users) {
    const locked = u.lockedUntil && u.lockedUntil.getTime() > Date.now();
    console.log(
      `[${u.role}] ${u.name} | email=${u.email ?? '—'} | phone=${u.phone ?? '—'} | code=${u.studentCode ?? '—'}`
      + ` | active=${u.isActive ? 'نعم' : 'لا'} | approved=${u.approvedAt ? 'نعم' : 'بانتظار'}`
      + ` | failed=${u.failedLoginAttempts}${locked ? ` | 🔒 مقفول حتى ${u.lockedUntil.toISOString()}` : ''}`,
    );
  }
  const sessions = await prisma.session.count();
  const activeSessions = await prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } });
  console.log(`\nالجلسات: ${sessions} إجمالي | ${activeSessions} نشطة`);
} finally {
  await prisma.$disconnect();
}
