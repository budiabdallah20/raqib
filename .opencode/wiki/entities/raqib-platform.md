---
title: منصة رقيب — نظرة عامة
tags: [overview, platform]
sourceRefs: [README.md, docs/ARCHITECTURE.md, package.json]
lastReviewed: 2026-10-27
---

# منصة رقيب RAQiB

نظام إدارة أكاديمية لكلية العلوم — جامعة السويس (عربي RTL).

## Stat Stack
- **Next.js 15 + React 19 + TypeScript strict** (App Router)، Tailwind.
- **Prisma 5** — محليًا SQLite (`prisma/dev.db`)، الإنتاج يفترض Docker/Postgres.
- **Auth**: JWT (httpOnly) + bcrypt + admin access code مشفر.
- **Pages**: (auth)/login+register، student/ professor/ admin/ dashboards، status/brand/changelog عامة.
- **البناء**: `server.mjs` يخدم HTTP/HTTPS منفذ 5000 محلياً.

## قواعد مصطلحة من docs
- سياسة حضور 75/25، QR توكن للحواض + manualCode 6 أرقام.
- AuditLog + rate-limit على كل route حساس.
- CSV بالـ BOM للعربي Excel.
- [[wiki/entities/page-map.md]] · [[wiki/concepts/deployment-targets.md]]
