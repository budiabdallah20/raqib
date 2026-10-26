/**
 * Generates a 16-digit admin access code and its bcrypt hash.
 *
 *   npm run admin:code            # random code
 *   npm run admin:code 1234...    # use your own 16 digits
 *
 * Put the hash in .env as ADMIN_ACCESS_CODE_HASH and keep the plain code offline.
 */
import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';

const provided = process.argv[2];
const code =
  provided ||
  Array.from({ length: 16 }, () => randomInt(0, 10)).join('');

if (!/^\d{16}$/.test(code)) {
  console.error('\n✖ The admin code must be exactly 16 digits.\n');
  process.exit(1);
}

const hash = await bcrypt.hash(code, 12);
const pretty = code.replace(/(.{4})/g, '$1 ').trim();
// Quoted + escaped dollars keeps @next/env (dotenv-expand) from reading
// `$2a` / `$12` as variable references — the only form both dotenv and
// Next.js's loader agree on.
const envLine = 'ADMIN_ACCESS_CODE_HASH="' + hash.replace(/\$/g, '\\$') + '"';

console.log('\n  Admin access code : ' + pretty);
console.log('  ' + envLine + '\n');
console.log('  Save the code somewhere safe, then paste that line into .env.\n');
