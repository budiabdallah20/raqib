---
title: تصادم التوز — Vercel serverless vs SQLite
tags: [deployment, gotcha, postgres, vercel]
sourceRefs: [prisma/schema.prisma, src/lib/db.ts, src/lib/env.ts, docker-compose.yml, .vercel]
lastReviewed: 2026-10-27
---

# تضاد منصات التوز

## قرار 2026-10-27: البيانات الحقيقية محلية — Production بلا قاعدة
- قرار المالك: كل بيانات الطلاب/الدكاترة الحقيقية تعيش في SQLite المحلي (`prisma/dev.db`) — لا قاعدة خارجية على Supabase/Neon.
- نشر Vercel يعمل كواجهة/معرض فقط: أي API حي (`/api/*`) يفشل وقت الاستعلام لعدم وجود `DATABASE_URL` على Vercel — سلوك معلوم ومعلن، ليس خللًا.
- envs على Vercel production: `ADMIN_ACCESS_CODE_HASH` (bcrypt، أرقام فقط ×12) + `JWT_SECRET` (64 hex) + `NEXT_PUBLIC_APP_URL=https://raqib-blue.vercel.app`. حدثها من CLI: `echo VALUE | vercel env add NAME production`.
- كود الأدمن: يتولد أرقام 12، يُحفظ الهاش فقط في `.env.local` (يطغى على قيمة `.env` القديمة ذات `\$...`) وكود نصي يظهر مرة واحدة للمالك في المحادثة؛ verifier بيلغي غير الأرقام المقارن bcrypt + rate-limit 5/15m/IP + AuditLog `ADMIN_LOGIN_FAILED`.

## تصفير الديمو (2026-10-27) — scripts/db-purge-demo.mjs
- نسخة احتياطية تلقائية في `prisma/backups/` قبل أي حذف.
- حذف: حضور/درجات/تسليمات/مهام/مصادر/تسجيلات/محاضرات/سلوتس/مقررات/إشعارات/توكنات + مستخدمين ديمو (بلا جلسة وأنشِئوا قبل اليوم).
- نتيجة أول تشغيل: 6 مستخدمين حيين (1 إدمن، 2 دكاترة، 3 طلاب) وباقي الجداول استعمالية = صفر.

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
