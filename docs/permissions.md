# PHASE 0 — Permissions Matrix (RAQEEB)

> Enforcement: `requireUser(roles)` + ownership checks in every handler. No DB-level RLS (Prisma only) — documented deviation, not a migration (owner locked Neon/Prisma).

## 1. Roles
- `STUDENT` — own records only. `PROFESSOR` — own courses/sections only (TAs = same role until `TeachingAssignment` lands, Phase 3). `ADMIN` — global, least-privilege (cannot edit grades directly, by design).
- Registration enum allows only `STUDENT/PROFESSOR` (no `ADMIN` self-create). Professors start `isActive=false` until admin approves. Vault code (16-digit bcrypt) is the only ADMIN entry via `/api/auth/admin`.

## 2. Endpoint matrix (verified)
| Area | STUDENT | PROFESSOR | ADMIN |
|---|---|---|---|
| Auth (login/register/admin/forgot/reset/passkey) | ✅ | ✅ | ✅ vault only |
| `/api/courses` GET | enrolled only | own only | all |
| `/api/courses` POST (create/enroll) | ❌ | ❌ | ✅ |
| Grades GET/PUT | ❌ | own courses only | ❌ (by design) |
| Grades/me | own only | ❌ | ❌ |
| Lectures GET | enrolled, no qrToken | own | all |
| Lectures POST/toggle, board | ❌ | own | ✅ |
| Attendance GET | own | own lectures' students | all |
| Scan POST | ✅ enrolled | ❌ | ❌ |
| Summary | own | ❌ | ❌ |
| Report (course) | ❌ | own course | ✅ |
| Resources POST/DELETE | ❌ | own course | ❌ |
| Materials (student) | enrolled only | ❌ | ❌ |
| Files download | enrolled / owner | own course | ✅ |
| Tasks GET/POST submit | enrolled, own subs | ❌ | ❌ |
| Tasks/manage | ❌ | own | ❌ |
| Uploads | task only | resource only | ❌ |
| Avatar upload | ✅ (pre-reg) | ✅ | ✅ |
| Drive upload (+status) | tasks only | resources+tasks | + backups |
| Schedule GET | any (read) | any (read) | any |
| Schedule POST (move/swap/CRUD) | ❌ | ❌ | ✅ |
| Student dashboard/profile/notes | own | ❌ | ❌ |
| Profile PATCH | self | self | self |
| Notifications | own | own | own |
| Admin `*` (users/courses/students/professors/settings/stats/audit/report/sessions/system/backup) | ❌ | ❌ | ✅ |

No IDOR found: every `courseId/lectureId/taskId/studentId` re-authorized against `user.id`, `enrollment`, or `course.professorId`. Admin course delete blocked if linked (409). Professor disable revokes sessions.

## 3. Gaps vs target (Rule 07/08)
- **MFA:** passkey optional/self-service; no enforced second factor for ADMIN. Target: ADMIN must have passkey or TOTP (Phase 3).
- **Sections/TAs:** no course-scoped professor map table; free-text `teacherName`. Target: `RoleAssignment` + `TeachingAssignment` (Phase 3).
- **Publication gate:** grades visible immediately (no draft/approved/published). Target: `Grade.status` + `GradeHistory` (Phase 7).
- **Downloads:** authenticated proxy ✅ but URLs permanent (no short-lived signed tokens). Target: `?token=HMAC(exp)` (Phase 10).
- **Rate limits:** covered on auth/scan/uploads/profile; missing on ~20 read/admin endpoints (low risk, enumerated in security checklist).

## 4. Privacy
- Students: own only. Professors: assigned courses only. Admin student detail returns full PII (audited, legitimate). `admin/users` omits phone/hash. No unpublished-grade exposure after Phase 7. No PII to AI (no AI code exists yet — vacuously compliant; Phase 9 must add approved controls).