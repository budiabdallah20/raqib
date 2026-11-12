# PHASE 0 — Implementation Roadmap (RAQEEB)

> Strict order (Rule 03): one phase at a time, tests + docs before close, **owner approval before next phase**. Owner locked: Neon/Prisma, 100% empty purge later, Phase 0 audit only.

## Phase 0 — Audit (DONE, awaiting approval)
- Deliverables: `project-audit.md`, `architecture.md`, `database-design.md`, `permissions.md`, `feature-matrix.md`, `implementation-roadmap.md`, `security-checklist.md` ✅
- Gate: owner signs off on Neon-retained, purge scope, and Phase 1 start.

## Phase 1 — Architecture & DB foundations
- Introduce `prisma/migrations/` + baseline migration (from-empty diff) before any prod push. Keep `db push` only as fallback.
- M1: `AcademicYear` + `Semester` + `credit_limit=17` setting. M2: `Role`/`RoleAssignment`/`TeachingAssignment` (dual-run with `User.role`).
- Quarantine fake data: disable `POST /api/admin/demo/reset` in prod (`ALLOW_DEMO_RESET=0` already), plan 100% empty purge (backup → purge → restore test → approval checkpoint).
- Tests: migration apply/rollback dry-run, role dual-read equivalence.

## Phase 2 — Design system + shared layouts
- Tokens: `#0B1120 / #111C32 / #17243B / #2563EB / #8B5CF6 / #263654` + semantic success/warning/danger. Cairo+Inter only (drop unused Space Grotesk/JetBrains or document use).
- Shared: Sidebar (desktop) + BottomNav (mobile), global `Toast` + `ConfirmDialog` + `ErrorBoundary` + `loading.tsx`/`error.tsx`, unified `StatCard`, unified charts, unified `humanSize`.
- Dark/light via `darkMode:class` + tokens; keep `portal-dark` as legacy alias until cutover. RTL/LTR with logical properties. A11y: focus-trap, skip-link, ≥44px targets.
- Tests: visual regression on auth/landing/admin, axe-core, keyboard nav.

## Phase 3 — Auth, roles, academic structure & enrollment
- MFA: ADMIN passkey/TOTP enforcement (policy + verify).
- M3: `CourseSection`, `CoursePrerequisite`. Evolve `Course` (semesterId, creditHours writable + CHECK via migration, capacity), `Enrollment` (semesterId, sectionId, status).
- Student self-registration UI + API: tx-enforced 17h sum, schedule-conflict vs `ScheduleSlot`, prereq check, duplicate prevention, capacity. Enrollment audit in-tx.
- Tests: credit-limit, conflict, prereq, duplicate, transaction rollback.

## Phase 4 — Lectures & QR attendance hardening
- M4: `AttendanceSession` split + `Lecture` status/reschedule/cancel-notify. Manual correction with mandatory reason. Excel/PDF server-side exports.
- Fix race: `upsert` in tx for `recordAttendance`. `IdempotencyKey` for open/close.
- Tests: duplicate race, QR expiry, late policy, manual-correction audit.

## Phase 5 — Assignments & Exam Studio
- M5 fields for `Task/TaskSubmission` (section/semester/weight/window/status).
- M6 exam tables: `Exam`, `Question` (MCQ/TF/SHORT/ESSAY), `AnswerKey` versioned, `ExamAttempt`, `StudentAnswer`. Availability windows, attempt limits, autosave, server-side deadline validation, duplicate-submission guard.
- Tests: submit integrity, duplicate prevention, autosave recovery.

## Phase 6 — Grading & gradebook
- M6 grading: `GradingReview`, `Grade` status DRAFT→APPROVED→PUBLISHED + `GradeHistory`. Deterministic objective grading server-side; essay AI-suggestion → instructor approve (Rule 11). Never auto-publish.
- Gradebook: matrix, bulk import (validated), weights config, draft/approved/published.
- Tests: objective accuracy, approval workflow, render-after-publish only.

## Phase 7 — Reports & notifications
- M7: persisted `AcademicReport` (async status, version, fileUrl) + notifications broadcast/priority/expiry. Reports: course/attendance/grade/exam, Excel/PDF server-side, timestamps + version IDs.

## Phase 8 — AI Course Assistant (RAG)
- Provider abstraction (Flash-Lite primary). Server keys only, per-user/course quotas, caching, retry/backoff, graceful exhaustion.
- Ingest: instructor-approved docs → extract → chunks → metadata/permissions → authorized retrieval → grounded citations. Citations mandatory. No cross-student data. Treat docs as untrusted.
- Tests: quota handling, unauthorized-chunk rejection, citation accuracy, privacy (no PII to AI without approved controls).

## Phase 9 — Security, performance, deployment
- Signed expiring download URLs, read-endpoint rate limits (Redis/Upstash), Dockerfile + healthchecks final pass, secret/dependency scanning, restore test for `.enc` backups, backup-key split, PWA performance (code-split, image/document optimization, lazy).
- DATA PURGE (if not done earlier): execute 100% empty under explicit approval, backup first.

## Per-milestone reporting (Rule 16)
Each phase: objectives, dependencies, files changed, DB impact, security notes, tests run, failures honestly, docs updated. Stop on critical test failure. Await owner approval before next phase. Routine decisions within a phase proceed autonomously; destructive/security-sensitive/cost/incident deployments require explicit approval.