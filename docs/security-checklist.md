# PHASE 0 — Security Checklist (RAQEEB)

> Verified status post-hardening. ✅ = holds, 🟡 = partial, ❌ = gap. Rule 07/08 + Rule 09/10.

## ✅ Holds (do not regress)
- [x] JWT HS256 pinned, `iss/aud/exp/sub/role/sid` verified (`src/lib/jwt.ts`)
- [x] Session DB revocation (`tokenHash`, `revokedAt`, `expiresAt`, `isActive`) + `revokeAllSessions` on reset/password-change
- [x] HttpOnly/Secure/SameSite cookies, `TRUST_PROXY`-aware `Secure` + IP (`src/lib/auth.ts`, `src/lib/security.ts`)
- [x] bcrypt-12 user passwords, DUMMY_HASH timing, lockout 5×15m (post-verify), unified 401/409, vault bcrypt-only
- [x] CSRF `sameOrigin` (Sec-Fetch-Site + Origin/Referer) on all mutating API
- [x] Zod everywhere + 1MB/25MB body limits; `dangerouslySetInnerHTML` only static JSON-LD
- [x] PII AES-256-GCM per-field (deterministic only for searchable uniques), fail-closed prod, redacted logs, hashed IPs
- [x] QR 15s JWT, rotating 5-20s, enrollment gate, unique attendance, 12/min limit, audit
- [x] Uploads: magic bytes + ownership + HMAC binding, storage 0600 outside `public`, path-traversal blocked, Drive folder allowlist, proxy downloads (ADMIN/prof/enrolled)
- [x] Headers: HSTS preload, CSP nonce + `frame-ancestors none`, `nosniff`, `Permissions-Policy`, `COOP/COEP/CORP`, `poweredByHeader:false`, `no-store` on API
- [x] Docker non-root, `JWT_SECRET/PII_KEY` required, `ALLOW_DEMO_RESET=1` rejected in prod, `TRUST_PROXY=1` required in prod
- [x] Audit logging on all sensitive ops with redaction

## ❌ Gaps (close in roadmap phases)
- [ ] **MFA enforced:** ADMIN has no mandatory 2nd factor (Phase 3)
- [ ] **DB-level RLS:** app-level RBAC only, no Postgres RLS (accepted deviation — Neon/Prisma locked; document, don't migrate)
- [ ] **Signed expiring URLs:** `/api/files/*` are permanent UUIDs, no short-lived token (Phase 9)
- [ ] **Grade publication gate:** grades live immediately, no DRAFT→APPROVED→PUBLISHED (Phase 6) + cohort rank reads peers server-side (rank only)
- [ ] **Backup restore testing:** no automated restore for `*.json.enc`; SQLite backup plaintext; no in-app Postgres backup (Phase 9)
- [ ] **Dependency/secret scanning:** no `audit`/Snyk/Dependabot in CI (Phase 9); `prisma` behind latest, `eslint` EOL — monitor
- [ ] **Rate limits:** missing on ~20 read/admin endpoints incl. `GET/PUT grades`, `admin/*`, `student/*`, `files/*` (Phase 9, Redis-backed)
- [ ] **Error leakage (ADMIN-only):** `admin/system`, `backup`, `sessions/[id]`, `stats` forward `error.message` — route through `handleApiError` (Phase 2 quick win)
- [ ] **Idempotency + jobs:** no `IdempotencyKey`, no durable queue for bulk/exam/AI work (Phases 3-8)
- [ ] **Key reuse:** PII key reused for backup encryption — split keys before any rotation (Phase 9)
- [ ] **No CHECK constraints:** grades/days/periods/GPA ranges enforced only by Zod — add raw SQL CHECKs in migration baseline (Phase 1)

## No AI surface yet
No model client, no AI env var, no RAG — vacuously compliant with "no PII to AI". Any Phase 8-9 AI must preserve that (server keys, scoped retrieval, quotas, no auto-publish).

## Owner gates
- Destructive data purge (100% empty) requires explicit approval + backup + restore test.
- Production deploy, paid infra, or irreversible migration requires explicit approval.
- Phase transitions require owner checkpoint (Rule 03 §5).