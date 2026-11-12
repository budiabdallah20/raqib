# PHASE 0 — Architecture (RAQEEB)

> Locked: **Next.js 15 + Prisma + Neon Postgres** (no Supabase). Single academic domain model shared by 3 portals (Rule 04).

## 1. Runtime topology
- `server.mjs` (HTTPS TLS 1.3, `NODE_ENV` prod → `0.0.0.0:5000`) → Next.js App Router → `src/middleware.ts` (CSRF, body limits, JWT role redirect, CSP nonce, `no-store` on API).
- Prisma `src/lib/db.ts`: dialect-aware (SQLite local / Neon Postgres prod via `scripts/prisma-dialect.mjs`). PII transparent encryption via `$extends` (AES-256-GCM, HKDF per-field).
- Storage: `src/lib/storage.ts` (UUID names, `safePath`, HMAC upload-binding) + `src/lib/drive.ts` (REST/rclone). Downloads always via `/api/files/*` (authenticated proxy).
- Backups: `scripts/db-backup.mjs` (SQLite `VACUUM INTO`) + `scripts/db-backup-drive.mjs` (JSON export, hashes redacted, AES-256-GCM `.enc`, rclone to Drive).

## 2. Layering (preserve, don't rebuild)
- `src/lib/*`: `auth` (cookie+session), `jwt` (HS256 WebCrypto), `session` (DB revocation), `security` (rate limit, audit, CSV guard), `crypto` (AES-GCM), `env` (fail-closed boot), `csp`, `validations` (Zod), `api` (fetch helper w/ dead-session recovery), `portal-prefs` (localStorage UI prefs ONLY — never authoritative for grades/attendance).
- `src/app/api/*` (53 routes): thin handlers → `requireUser(roles)` → Zod → business check → Prisma → `logAudit`. No direct DB from client.
- `src/components/*`: `ui/` primitives + `shared/` shells + `auth/` wizard + `landing/` + `student/` widgets + `admin/` charts + `professor/`. UI never queries DB directly.

## 3. Data flow (Rule 06 lifecycle)
Validate → Authenticate → Authorize → Business rules → Transaction → Mutate → Audit (same tx — currently NOT met, targets in roadmap) → Commit → Return explicit result → Invalidate client queries (poll 5-30s, no SSE) → Async notify.

## 4. Enrollment & attendance invariants (current vs target)
- **Current:** Enrollment = bare `(studentId,courseId)` upsert, no credit sum, no conflict/prereq check, no tx. Attendance = check-then-act + unique backstop (`P2002` → 500 on race), no tx.
- **Target (Phases 3-4):** Tx-enforced: credit-limit sum (key `credit_limit=17` in AppSetting allowlist), schedule-conflict vs `ScheduleSlot`, prerequisite check, `upsert skipDuplicates`, `AttendanceSession` split from `Lecture`.

## 5. QR attendance pipeline (Rule 09)
Professor opens lecture → server mints JWT (`lec/crs/exp=15s/geo`, `qr-sign.ts`) + notifies → board rotates 5/10/15/20s (`qr_rotation_seconds` setting) → student scans → server validates auth + enrollment + session + signature + expiry (3s skew) → `$$unique([lectureId,studentId])` idempotent → audit. QR ≠ proof of physical presence (documented limitation).

## 6. Design system direction (Rule 13)
- Tokens (locked by owner): `--background:#0B1120`, `--surface:#111C32`, `--surface-elevated:#17243B`, `--primary:#2563EB`, `--accent:#8B5CF6`, `--border:#263654`, text `#F8FAFC/#94A3B8`, success/warning/danger semantic. Arabic Cairo / Latin Inter. 8px spacing, radius 12-20px, minimal glass, 150-250ms motion, skeleton/empty/error/toast system.
- **Owner ask "black shiny + magical touches":** interpreted as deep navy-black `#0B1120` (NOT pure `#000`), glossy layered surfaces, electric-blue/violet glow on active states, progress rings, timeline, command center. No heavy 3D (Rule 13 prohibits). Light mode via `darkMode:class` + shared tokens (currently unused, must be built in Phase 2).

## 7. AI boundary (Phases 8-9, not now)
Provider-independent server service (Gemini Flash-Lite primary, Flash secondary). Server-held keys, per-user/course quotas, caching, graceful exhaustion, no paid fallback. RAG: instructor-approved docs → extract → chunks → authorized retrieval → grounded citations. Treat docs as untrusted. **No PII to free-tier AI without approved controls. AI grades never auto-publish (Rule 11 workflow mandatory).**
