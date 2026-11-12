/**
 * يحدّد لغة Prisma حسب DATABASE_URL: postgres/** → postgres، وإلا sqlite.
 * مصدر الحقيقة واحد دائمًا (prisma/schema.prisma) — يُستنسخ ملف مؤقت بلغة
 * الهدف (prisma/schema-<dialect>.generated.prisma) للاستخدام من البناء/الأوامر.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config'; // يحترم process.env الموجود — لازم قبل قراءة DATABASE_URL

const prismaDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma');

export function resolveDialect(databaseUrl) {
  const url = databaseUrl || process.env.DATABASE_URL || '';
  return /^(postgres|postgresql):/i.test(url) ? 'postgres' : 'sqlite';
}

export function dialectSchemaPath(databaseUrl) {
  const dialect = resolveDialect(databaseUrl);
  const canonical = readFileSync(join(prismaDir, 'schema.prisma'), 'utf8');
  let adapted = canonical.replace(
    /provider\s*=\s*"sqlite"/,
    `provider = "${dialect}"`,
  );
  // Postgres على Neon: db push/migrate يشغّل دائمًا على الرابط المباشر (غير الممضمّن PgBouncer) — directUrl
  if (dialect === 'postgres' && !/directUrl/.test(adapted)) {
    adapted = adapted.replace(
      /datasource\s+db\s*\{/,
      `datasource db {`,
    );
    adapted = adapted.replace(
      /(provider\s*=\s*"postgres"\s*\n\s*url\s*=\s*env\("DATABASE_URL"\))/,
      `$1\n  directUrl = env("DATABASE_URL_UNPOOLED") // مستقيم (بدون pooler) — الهجرات فقط`,
    );
  }
  const out = join(prismaDir, `schema-${dialect}.generated.prisma`);
  writeFileSync(out, adapted);
  return out;
}

// CLI: node scripts/prisma-dialect.mjs → يطبع مسار الملف المحوّل
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(dialectSchemaPath().replace(/\\/g, '/'));
}
