/**
 * gdrive-setup.mjs — يستخرج بيانات Google Drive OAuth من ملف إعداد rclone
 * ويحقنها في `.env.local` حرفيًا كما في التوجيه:
 *
 *   GDRIVE_REFRESH_TOKEN, GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET,
 *   GDRIVE_ROOT_FOLDER_ID, DATABASE_URL
 *
 * المسار الافتراضي للإعداد:
 *   Windows: %APPDATA%\rclone\rclone.conf
 *   Linux:   ~/.config/rclone/rclone.conf
 *
 * الاستخدام:
 *   node scripts/gdrive-setup.mjs                 # extraction + right injection
 *   node scripts/gdrive-setup.mjs --remote gdrive --root raqib
 *   node scripts/gdrive-setup.mjs --root-folder-id <id>
 *
 * لا يطبع أي قيم بسر — يتحقق فقط من الشكل والطول.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** مجلد المشروع = مجلد التشغيل (npm scripts يتنفذ دائمًا من الجذر) */
const PROJECT_ROOT = path.resolve(process.cwd());
const REMOTE_NAME = argOf('--remote') || 'gdrive';
const ROOT_FOLDER_NAME = argOf('--root') || 'raqim'.replace('raqim', 'raqib');

function argOf(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function loadIni() {
  const confPath =
    process.env.RCLONE_CONFIG ||
    (process.platform === 'win32'
      ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'rclone', 'rclone.conf')
      : path.join(os.homedir(), '.config', 'rclone', 'rclone.conf'));

  if (!fs.existsSync(confPath)) {
    console.error(`❌ لا يوجد ملف إعداد rclone: ${confPath}`);
    console.error('   شغّل أولًا:  rclone config');
    process.exit(1);
  }
  const text = fs.readFileSync(confPath, 'utf8');
  const sections = {};
  let cur = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      cur = line.slice(1, -1);
      sections[cur] = {};
      continue;
    }
    if (!cur || !line.includes('=')) continue;
    const eq = line.indexOf('=');
    sections[cur][line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return { sections, confPath };
}

/** يقرأ .env لمجلد المشروع — يحتوي DATABASE_URL من Neon */
function readDotEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^"|"$|^\$"/g, '').trim();
  }
  return env;
}

function upsertEnvFile(file, updates) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const [key, value] of Object.entries(updates)) {
    if (!value) continue;
    const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    const line = `${key}="${value}"`;
    if (re.test(text)) text = text.replace(re, line);
    else text = (text.endsWith('\n') ? text : `${text}\n`) + `${line}\n`;
  }
  fs.writeFileSync(file, text, 'utf8');
}

/* ------------------------------------------------------------------ 1 */
const { sections, confPath } = loadIni();
const remote = sections[REMOTE_NAME];
if (!remote) {
  console.error(`❌ remote «${REMOTE_NAME}» غير موجود في ${confPath}`);
  process.exit(1);
}
const token = remote.token ? JSON.parse(remote.token) : null;
const refreshToken = (token?.refresh_token || (remote.refresh_token || '')).trim();
const clientId = (remote.client_id || process.env.GDRIVE_CLIENT_ID || '').trim();
const clientSecret = (remote.client_secret || '').trim();

if (!refreshToken) {
  console.error('❌ لا يوجد refresh_token في الـremote. شغّل:  rclone reconnect ' + REMOTE_NAME);
  process.exit(1);
}

/* ------------------------------------------------------------------ 2 */
// root folder id: إما من وسيط، أو نحسمه من الدِرَكت الأساسي (هو المجلد raqib)
let rootFolderId = argOf('--root-folder-id') || '';
if (!rootFolderId) {
  rootFolderId = remote.root_folder_id || ''; // بعض الإعدادات القديمة تحفظه
}

/* ------------------------------------------------------------------ 3 */
const dotenv = readDotEnv(path.join(PROJECT_ROOT, '.env'));
const envLocalPath = path.join(PROJECT_ROOT, '.env.local');
upsertEnvFile(envLocalPath, {
  GDRIVE_REFRESH_TOKEN: refreshToken,
  GDRIVE_CLIENT_ID: clientId,
  GDRIVE_CLIENT_SECRET: clientSecret,
  GDRIVE_ROOT_FOLDER_ID: rootFolderId,
  // مجموعة صريح: DATABASE_URL من .env (Neon pooled)؛ لا كرِر أي بيانات فوقها
  // غير الـDrive حتى لا ننجرّ في تغيير الدِيرَكت المتزامن مع .env.
  DATABASE_URL: dotenv.DATABASE_URL,
});

/* ------------------------------------------------------------------ 4 */
// تحديث .env.local مع الحفاظ على الجذر folder name أيضًا
if (ROOT_FOLDER_NAME) {
  upsertEnvFile(envLocalPath, { GDRIVE_ROOT_FOLDER_NAME: ROOT_FOLDER_NAME });
}

const mask = (s) => (s ? `${String(s).slice(0, 6)}…${String(s).slice(-4)} (${String(s).length} chars)` : '—');
console.log('✅ استخراج ركلون ناجح — الحقن في .env.local:');
console.log(`   conf:                ${confPath}`);
console.log(`   remote:              ${REMOTE_NAME}`);
console.log(`   GDRIVE_REFRESH_TOKEN ${mask(refreshToken)}`);
console.log(`   GDRIVE_CLIENT_ID     ${clientId ? mask(clientId) : '— (rclone الافتراضي: وضع rest يحتاج OAuth client خاص لاحقًا)'}`);
console.log(`   GDRIVE_CLIENT_SECRET ${clientSecret ? mask(clientSecret) : '—'}`);
console.log(`   GDRIVE_ROOT_FOLDER_ID ${rootFolderId || '— (يُكتشف ديناميكيًا من اسم raqib)'}`);
console.log(`   DATABASE_URL         ${dotenv.DATABASE_URL ? 'موجود من .env (Neon) ✔' : '❌ غير موجود في .env'}`);
