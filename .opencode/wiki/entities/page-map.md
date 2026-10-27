---
title: خريطة الصفحات والـAPIs
tags: [routing, overview]
sourceRefs: [src/app]
lastReviewed: 2026-10-27
---

# خريطة الصفحات (App Router)

## واجهات
- `/` الهبوط العام (`api/public/metrics` البيانات)، `/status`, `/brand`, `/changelog`
- `(auth)/login`, `(auth)/register`
- `student/*`: dashboard، attendance، profile، schedule، tasks
- `professor/*`: dashboard، grades، reports، board، schedule، resources، tasks
- `admin/*`: dashboard، courses、students、professors、schedule、reports、audit、settings

## API أقسام
| مسار | وظيفة |
| --- | --- |
| `/api/auth/*` | login/register/forgot/reset/me/logout/admin |
| `/api/attendance/*` | scan + summary + report |
| `/api/lectures` + `board` | إدارة ومحور العرض |
| `/api/tasks`, `/grades`, `/schedule`, `/resources`, `/quotes` | أكاديمي آخين |
| `/api/admin/*` | stats/users/students/courses/audit/demo-reset/settings/report |
| `/api/upload/*`, `/api/files/*` | الملفات المرجعية |
| `/api/health` | فحص صحة |
