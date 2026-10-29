/**
 * تنفيذ أي أمر prisma على لغة DATABASE_URL (بشكل تلقائي):
 * node scripts/with-dialect.mjs db push
 * node scripts/with-dialect.mjs migrate deploy
 */
import { spawnSync } from 'node:child_process';
import { dialectSchemaPath } from './prisma-dialect.mjs';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node scripts/with-dialect.mjs <prisma-args...>');
  process.exit(1);
}

const schema = dialectSchemaPath();
console.log(`[raqib:prisma] schema: ${schema}`);
const res = spawnSync('npx', ['prisma', ...args, '--schema', schema.replace(/\\/g, '/')], {
  stdio: 'inherit',
  shell: true,
});
process.exit(res.status ?? 0);
