# PHASE 0 — Project Audit (RAQEEB)

> **Rule 01/03:** Read-only audit. No destructive DB changes. No rewrite until owner approval.
> **Owner decisions (locked):** Stay on **Neon/Prisma** (no Supabase migration), clean DB to **100% empty** in a later approved phase, start with **PHASE 0 audit only**.

## 1. Stack (verified in code)
- Next.js 15 App Router · React 19 · TypeScript strict · Prisma 5.22 · Tailwind 3 (RTL, Cairo+Inter) · Vitest + Playwright · `server.mjs` HTTPS TLS 1.3 (`:18-23`, binds `0.0.0.0` prod / `localhost` dev).
- DB: canonical `prisma/schema.prisma:5-8` SQLite (local). Prod: Neon Postgres via `scripts/prisma-dialect.mjs` → `schema-postgres.generated.prisma` + `directUrl`. No `prisma/migrations/` — `db push` only.
- Auth: custom JWT HS256 (`iss=raqib/aud=raqib-web`) + `Session` table (`tokenHash/sha256`, `revokedAt`, `expiresAt`, `lastSeenAt`) + passkey WebAuthn + vault code (16-digit bcrypt). Cookies HttpOnly/Secure/SameSite=Lax.
- Storage: local `storage/` + Google Drive via rclone/REST (`src/lib/drive.ts`), uploads proxied via `/api/files/*` with authz.
- No AI code at all (no Gemini/OpenAI client, no vector store).

## 2. What works today (DB-backed, not mock)
- Landing `/` + metrics `/api/public/metrics` live counts + `/api/health` → `SELECT 1` real.
- Auth: login/register/admin/forgot/reset/passkey + middleware CSRF/ownership + rate limits + audit.
- Admin: dashboard stats, students/professors lists, courses CRUD, drag-drop schedule builder, audit log, report CSV, settings (term dates, QR rotation, emergency banner), backup.
- Doctor: dashboard, create lecture + rotating QR board (5-20s), grades (quiz/work/midterm), tasks, schedule view, resources PDF upload, attendance report.
- Student: dashboard (15 widgets), timetable, QR scan + offline queue, tasks, materials, notes, attendance history, GPA curve/what-if, planner/pomodoro, notices, profile + passkey.
- Encryption: PII AES-256-GCM transparent (`src/lib/db.ts`), PII redaction in logs, Drive backups encrypted AES-256-GCM with hashes redacted.

## 3. What's fake / demo (to be purged — plan only, NOT executed in Phase 0)
- Seed: 1 admin + 11 staff + 1 student + 7 courses (MAT201/203/207/211/213/305, COM201) + 11 ScheduleSlots + 10 Quotes. After the recent purge, only **1 ADMIN** remains in Neon, but **7 courses + schedules + quotes still exist** and are reachable. `POST /api/admin/demo/reset` can regenerate 180 demo students.
- **Owner-approved target:** 100% empty (users except admin retained, courses/schedules/quotes/tasks/grades/etc wiped) executed only in an approved later phase, after backup + restore test.
- No other mock data in UI: counters are live SQL; `changelog` demo note is historical text only.

## 4. Feature coverage summary (detail in `feature-matrix.md`)
- **Implemented:** dashboards, timetable, QR attendance (core), assignments/tasks, resources, grades entry (partial), admin ops, audit, notifications (in-app).
- **Partial:** course mgmt (no sections/creditHours writable/prereq), grading (no final input, no weights, no publish states), reports (attendance-only), notifications broadcast, storage/health (no AI quota).
- **Missing (greenfield):** student self-registration (17h), Exam Studio + questions + attempts + autograding, gradebook states/history, academic years/semesters, course sections/teaching assignments, RAG AI Assistant + AI grading workflow, persisted reports, MFA enforcement, signed expiring URLs, DB-level RLS (Prisma only), idempotency keys, durable jobs.

## 5. Broken / inconsistent (non-destructive inventory)
- `/privacy` + `/terms` listed in `PUBLIC_PATHS` (`constants.ts:54-55`) but no routes — footer uses `PolicyModal` instead. Harmless orphan.
- `/student/profile` uses `DashboardShell` instead of `StudentShell` (loses theme tools).
- Professor board hardcodes 20s rotation, ignores `qr_rotation_seconds` setting.
- `final` grade column exists but `PUT /api/grades` ignores it (only quiz/work/midterm 0-60) — final can't be entered.
- Notifications settings section is "coming soon" (no-op).
- Fonts: `Space Grotesk` + `JetBrains Mono` loaded in `layout.tsx` but largely unused.
- Charts: 4 parallel stacks (admin SVG charts vs student MiniCharts vs inline curve vs distribution bar).
- `darkMode:'class'` unused; dark is custom CSS (`portal-dark`), no global toggle.

## 6. Reusable assets (keep, don't duplicate)
`src/components/ui/*` (button/card/input/label/form/tabs), `Logo`, `DashboardShell/StudentShell`, `AdminSheet/AdminModal/Pager`, `Skeletons/EmptyState`, `QRScanner`, `EmergencyBanner`, `splash/welcome` system. Duplicated: WelcomeBanner (×2), stat cards (×3), human-size helpers (×3). Consolidate in Phase 2.

## 7. Risks & constraints
- No migrations → `db push` only; no rollback artifacts. Must introduce `prisma/migrations/` + baseline before any destructive phase.
- No CHECK constraints in Postgres — invariants live only in Zod → scripts/raw writes can corrupt states.
- In-memory rate limiting (10k keys cap) doesn't survive multi-instance/restart; needs Redis/Upstash for prod scale.
- No restore test for Drive `*.json.enc` backups; SQLite backup is plaintext file.
- PII encryption key reuse between field encryption and backup encryption (split keys before Phase 10).

## 8. Handoff
This audit is the baseline. Next: `architecture.md`, `database-design.md`, `permissions.md`, `feature-matrix.md`, `implementation-roadmap.md`, `security-checklist.md`. **Awaiting owner approval to start Phase 1.**
