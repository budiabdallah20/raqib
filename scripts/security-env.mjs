/**
 * تدوير أسرار البيئة وتوليد كود إدارة جديد.
 *
 *   npm run security:env              # يضمن القيم الآمنة، ويحافظ على JWT_SECRET الحالي
 *   npm run security:env -- --rotate  # يدوّر JWT_SECRET (يُخرج كل المستخدمين)
 *   npm run security:env -- --no-admin
 *
 * يأخذ نسخة احتياطية من .env قبل أي تعديل.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';

const args = new Set(process.argv.slice(2));
const rotate = args.has('--rotate') || args.has('--force');
const skipAdmin = args.has('--no-admin');

const envPath = path.join(process.cwd(), '.env');
const examplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) fs.copyFileSync(examplePath, envPath);
  else fs.writeFileSync(envPath, '', 'utf8');
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = path.join(process.cwd(), `.env.bak-${stamp}`);
fs.copyFileSync(envPath, backupPath);

let content = fs.readFileSync(envPath, 'utf8');

function readValue(key) {
  const match = content.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\r\\n]*)"?`, 'm'));
  return match ? match[1] : '';
}

/** upsert يحافظ على ترتيب الملف وتعليقاته */
function setValue(key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}\\s*=.*$`, 'm');
  if (re.test(content)) content = content.replace(re, line);
  else content = `${content.replace(/\s*$/, '')}\n${line}\n`;
}

function strongSecret() {
  return randomBytes(48).toString('base64url');
}

const isWeak = (secret) =>
  !secret || secret.length < 32 || /change-me|super-secret|replace|example|secret-key/i.test(secret);

const changes = [];

const currentSecret = readValue('JWT_SECRET');
if (rotate || isWeak(currentSecret)) {
  setValue('JWT_SECRET', strongSecret());
  changes.push(rotate ? 'JWT_SECRET (تدوير كامل)' : 'JWT_SECRET (كان ضعيفًا)');
}

// السيرفر محلي مباشر بدون reverse proxy
if (!readValue('TRUST_PROXY')) {
  setValue('TRUST_PROXY', '0');
  changes.push('TRUST_PROXY=0');
}

// إعادة ضبط الديمو مسموحة محليًا فقط (الكود يمنعها في production)
if (!readValue('ALLOW_DEMO_RESET')) {
  setValue('ALLOW_DEMO_RESET', process.env.NODE_ENV === 'production' ? '0' : '1');
  changes.push('ALLOW_DEMO_RESET');
}

let adminCode = null;
if (!skipAdmin) {
  adminCode = Array.from({ length: 16 }, () => randomInt(0, 10)).join('');
  const hash = await bcrypt.hash(adminCode, 12);
  // الهاش لازم يكون بين علامات اقتباس مع هروب $ حتى لا يفسّره Next
  setValue('ADMIN_ACCESS_CODE_HASH', hash.replace(/\$/g, '\\$'));
  changes.push('ADMIN_ACCESS_CODE_HASH (كود جديد)');
}

fs.writeFileSync(envPath, content, 'utf8');

console.log(`\n✅ تم تحديث .env (${changes.length} تغيير)`);
for (const change of changes) console.log(`   • ${change}`);
console.log(`\n🗄️  نسخة احتياطية: ${backupPath}`);

if (adminCode) {
  const pretty = adminCode.replace(/(.{4})/g, '$1 ').trim();
  console.log('\n🔐 كود الدخول للإدارة (يُعرض مرة واحدة — احفظه الآن):');
  console.log(`   ${pretty}\n`);
}

if (rotate || isWeak(currentSecret)) {
  console.log('⚠️  تغيير JWT_SECRET يُنهي كل الجلسات الحالية؛ سيحتاج الجميع لتسجيل الدخول من جديد.\n');
}
