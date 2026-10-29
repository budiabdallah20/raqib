/**
 * أداة بناء موحّدة: تختار لغة Prisma من DATABASE_URL (postgres أو sqlite)
 * ثم تولّد العميل وتنفّذ next build. تُستخدم في:
 *  - التطوير المحلي: DATABASE_URL=file:... → sqlite (كالعادة)
 *  - Vercel: DATABASE_URL=postgres://... → postgres تلقائيًا
 */
import { spawnSync } from 'node:child_process';
import { dialectSchemaPath } from './prisma-dialect.mjs';

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (res.status) process.exit(res.status);
}

const schema = dialectSchemaPath();
console.log(`\n[raqib:build] Prisma schema (dialect): ${schema}`);

run('npx', ['prisma', 'generate', '--schema', schema]);
run('npx', ['next', 'build']);
