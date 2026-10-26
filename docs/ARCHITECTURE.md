# 🏗️ معمارية رقيب RAQiB

## Stack
- **Next.js 15 (App Router) + TypeScript strict** — واجهات + APIs في مشروع واحد.
- **Tailwind** مع design tokens (ink/gold/cream/amber/orange/crimson) — الهوية الذاتية في `tailwind.config.ts`.
- **Prisma 5** — `{ dev: SQLite }`، الإنتاج: PostgreSQL (docker-compose.yml + Dockerfile).
- **Auth**: JWT (httpOnly/secure/sameSite=lax) + bcrypt(12) + كود أدمن مُشفّر bcrypt في `.env`.
- **Validation**: Zod في كل route حساس + rate-limit + AuditLog.

## خريطة المكونات
```
src/
├── app/
│   ├── (auth)/                تسجيل + دخول
│   ├── student/               داشبورد الطالب (+ /attendance سجل الحضور WP2)
│   ├── professor/             داشبورد الدكتور (+ /reports WP2، + /board لوحة العرض WP3)
│   ├── admin/                 إدارة الكلية (+ /reports WP2، + أزرار ديمو WP1)
│   ├── brand/ status/ changelog/   صفحات عامة (WP5/WP6)
│   └── api/
│       ├── auth/              login/register/logout/forgot/reset/me/admin
│       ├── attendance/        scan (POST) + records + summary + report (CSV)
│       ├── lectures/          CRUD + toggle + **board** (تدوير تلقائي WP3)
│       ├── notifications/     جرس الإشعارات (WP4)
│       ├── public/metrics     أرقام حقيقية لواجهة الهبوط (WP6)
│       ├── admin/             stats/report/demo-reset/users/courses/audit
│       └── health             فحص صحة (WP7)
├── lib/
│   ├── attendance-policy.ts    سياسة 75/25/0.5 + SAFE/WARNING/DENIED (WP2)
│   ├── qr.ts                   مشتق كود يدوي 6 أرقام (WP3)
│   ├── notify.ts               إشعارات داخلية + بريد Resend مع fallback (WP4)
│   ├── security.ts             rate limit + logAudit + sanitize
│   └── auth.ts                 جلسة + صلاحيات
└── components/                 Logo / Splash / DashboardShell / Navbar(جرس)…
```

## تدفق الحضور (WP3)
```
الدكتور: POST /api/lectures (toggle) → token جديد 15د
لوحة العرض: GET /api/lectures/board?lectureId=… (كل 7 ثوانٍ)
   ├─ التوكن عمره > 20 ثانية؟ → يولد رمزًا جديدًا (صلاحية 60 ثانية) ويحفظه
   └─ يعيد: token + manualCode + attendees + present/late + آخر 5 مسحات
الطالب: POST /api/attendance {token|code6}
   ├─ code6 → مطابقة manualCodeOf(lecture.qrToken) عبر المحاضرات المفتوحة
   ├─ الحالات: OUT_OF_RANGE / EXPIRED / CLOSED / NOT_ENROLLED / duplicate
   ├─ LATE إن تجاوز 20 دقيقة من startsAt
   └─ AuditLog (action=ATTENDANCE_SCAN) مع IP/UA + إنذار حرمان عند هبوط تحت العتبة
```

## قواعد أمان غير قابلة للكسر
1. `qrToken/qrExpiresAt` لا يُسرَّبان للطالب إطلاقًا (select صريح — اختبار آلي يمنع الانتكاس).
2. لا سر في كود العميل؛ الكوكيز httpOnly/secure/sameSite لا تُعطل.
3. كل route حساس: `requireUser(roles)` + Zod + rate-limit + `logAudit`.
4. `prisma/dev.db` لا يُمس دون نسخة احتياطية (`seed:demo --fresh` ينسخها تلقائيًا).
5. CSV للتصدير مفحوص بالـBOM `\uFEFF` لعرض عربي سليم في Excel، وكل تصدير يُسجل في AuditLog.

## نشر الإنتاج
```
docker compose up -d     # Postgres + التطبيق (شاهد docker-compose.yml)
DATABASE_URL=postgres://…   في .env
npm run backup:db        # نسخة يومية (أو cron على المضيف مع pg_dump)
GET /api/health          # مراقبة uptime
```

## الاختبارات
- **Vitest**: سياسة الحضور + مشتق الـQR + عدم تسريب التوكن (`npm run test`).
- **Playwright**: رحلة الطالب + سيناريو الدكتور + سيناريو الأدمن (`npm run test:e2e`).
- **CI**: `.github/workflows/verify.yml` (tsc + vitest + build + e2e اختياري).

## قيود معروفة
- Web Push (Service Worker) اختياري لم يُفعَّل بعد — الـCLI جاهز عبر notify.ts.
- Sentry اختياري — متغير `SENTRY_DSN` محفوظ في `.env.example`.
- Redis للـrate-limit عند التوزع — `REDIS_URL` محفوظ، الكود الحالي in-memory يكفي node واحد.
