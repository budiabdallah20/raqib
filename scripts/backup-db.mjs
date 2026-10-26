/**
 * 🗄️ نسخة احتياطية يومية لقاعدة بيانات رقيب — SQLite dev.
 * الاستخدام: npm run backup:db   (توصية: مجدولة عبر Windows Task Scheduler كل 24 ساعة)
 * تحفظ في prisma/backups/raqib-dev-YYYYMMDD-HHmmss.db وتحذف النسخ الأقدم من 14 يومًا.
 */
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const outDir = path.join(process.cwd(), 'prisma', 'backups');
fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19).replace(/-/g, (m, i) => (i === 3 || i === 6 ? m : '-')).replace(/T/, '-');
const stampFile = new Date()
  .toISOString()
  .replace(/[:T]/g, '-')
  .slice(0, 19);
const target = path.join(outDir, `raqib-dev-${stampFile}.db`);

try {
  fs.copyFileSync(dbPath, target);
  const size = (fs.statSync(target).size / 1024).toFixed(1);
  console.log(`✅ النسخة: ${target} (${size} KB)`);
} catch (err) {
  console.error('❌ فشل النسخ — هل السيرفر يعمل ومنافذ DB مغلقة؟', err.message);
  process.exit(1);
}

/* تنظيف: أبقِ آخر 14 نسخة فقط */
const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.db')).sort();
for (const old of files.slice(0, Math.max(0, files.length - 14))) {
  fs.unlinkSync(path.join(outDir, old));
  console.log(`🧹 حذف نسخة قديمة: ${old}`);
}
