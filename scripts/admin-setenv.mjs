/**
 * admin-setenv.mjs — يولّد كود إدارة جديد 16 رقم، يحط الـ hash في .env
 * بشكل سليم (سطر واحد، مقفول بعلامات اقتباس ودولارات مهرّبة)، ويتحقق عكسيًا
 * من .env نفسه بالـ bcrypt. يطبع الكود مرة واحدة — خزّنه في مكان آمن.
 *
 *   node scripts/admin-setenv.mjs            # كود عشوائي
 *   node scripts/admin-setenv.mjs 1234...16  # كود محدد
 */
import { randomInt } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';

const provided = process.argv[2];
const code = provided || Array.from({ length: 16 }, () => randomInt(0, 10)).join('');
if (!/^\d{16}$/.test(code)) {
  console.error('✖ الكود يجب أن يكون 16 رقمًا بالضبط');
  process.exit(1);
}

const hash = await bcrypt.hash(code, 12);
// علامات الاقتباس + تهريب الدولارات: الصيغة الوحيدة التي يتفق عليها dotenv وNext.js
const envLine = `ADMIN_ACCESS_CODE_HASH="${hash.replace(/\$/g, '\\$')}"`;

const envPath = '.env';
const env = readFileSync(envPath, 'utf8');
const lines = env.split(/\r?\n/);
const idx = lines.findIndex((l) => l.startsWith('ADMIN_ACCESS_CODE_HASH='));
if (idx >= 0) lines[idx] = envLine;
else lines.push(envLine);
writeFileSync(envPath, lines.join('\n'), 'utf8');

// تحقق عكسي من الملف المكتوب نفسه — لا ثقة إلا بالقراءة بعد الكتابة
const written = readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .find((l) => l.startsWith('ADMIN_ACCESS_CODE_HASH='));
const storedHash = written
  .slice('ADMIN_ACCESS_CODE_HASH='.length)
  .replace(/^["']|["']$/g, '')
  .replace(/\\\$/g, '$');
const roundtrip = await bcrypt.compare(code.replace(/\D/g, ''), storedHash);

console.log('\n  Admin access code : ' + code.replace(/(.{4})/g, '$1 ').trim());
console.log('  ENV_LINE_WRITTEN: ' + (idx >= 0 ? `replaced line ${idx + 1}` : 'appended'));
console.log('  ROUNDTRIP_FROM_ENV: ' + (roundtrip ? 'VERIFY_OK' : 'VERIFY_FAIL') + '\n');
process.exit(roundtrip ? 0 : 1);
