---
title: تصادم التوز — Vercel serverless vs SQLite
tags: [deployment, gotcha, postgres, vercel]
sourceRefs: [prisma/schema.prisma, src/lib/db.ts, src/lib/env.ts, docker-compose.yml, .vercel]
lastReviewed: 2026-10-27
---

# تضاد منصات التوز

## الحقائق
- `prisma/schema.prisma`: `provider = "sqlite"` بقاعدة `file:` من `DATABASE_URL`.
- `src/lib/db.ts`: طبقة Prisma client عالمية + أمرصمة SQLite (WAL, foreign_keys, busy_timeout).
- `docs/ARCHITECTURE.md`: الإنتاج يُدارة بـ `docker-compose.yml` + Postgres، لكن الـschema نفسه sqlite-only.
- `.vercel/repo.json` موجود: مشروع مرتبط بـ Vercel (تسطيب CLI محلي `vercel` dk.json).
- `src/lib/env.ts` (`assertEnv`): في الإنتاج يرمي إيرور لو `JWT_SECRET` < 32 أو placeholder، `ADMIN_ACCESS_CODE_HASH` ناقص، أو `NEXT_PUBLIC_APP_URL` مش https.
- no `vercel.json`, no `.github/workflows` (المرجع `verify.yml` في docs مش موجود فعلاً).

## المخاطر المعروفة للـ Vercel serverless
1. SQLite `file:` على Vercel read-only → كل الكتابة لوحدة الستاطيك تفشل (حضور/رصد).
2. `hardenSqlite` pragmas هر غير قابل للتنفيذ على ephemeral fs.
3. متغيرات بيئة مُطلوبة في الإنتاج لازمة في Vercel، وإلا 500 على كل مطلب.
4. لا رستكصة: قاعدة البيانات تنفسي مش فوق Vercel؛ يلزم Postgres في مزود خارجي (Supabase/Neon).
