# Phase 01 — Academic Theater execution plan

## Audit (2026-11-09)

- Existing app: Next.js 15 App Router, React 19, Tailwind, Framer Motion, Cairo/Inter, Prisma with Neon Postgres in production. Local SQLite exists for tests. No Supabase migration is part of this phase.
- Public routes: `/`, `/login`, `/register`. Recovery currently lives in `ForgotPasswordModal` and uses `/api/auth/forgot` and `/api/auth/reset`; there is no email-verification provider flow to wrap. Authenticated `/` redirects by the server-owned role. Middleware and APIs enforce private access.
- Current public UI: landing, a first-session loader, three role cards, login/register/admin tabs, recovery modal, and a technology gallery. They function, but the theater styling is split among three CSS files and hard-coded colors. The loader shows weighted percentages even when the probes do not supply measurable progress. Literal burgundy curtains conflict with the contemporary architectural direction.
- Registration API accepts Student and Professor requests only. Professor accounts are created inactive pending approval. Admin sign-up is absent; admin tab is sign-in only. Preserve this boundary.
- The working tree already has extensive uncommitted work. `RAQEEB_MASTER_AGENTS.md` assigns visual ownership to OpenCode, while `docs/coordination.md` assigns Codex design tweaks in the current collaboration; the user explicitly assigned Codex this Phase 01 scope. No active file lock or handoff directory was found. OpenCode's desktop service is running; avoid private portal files and record every Phase 01 file in the handoff. Do not claim agent coordination.
- Baseline: TypeScript passed; focused ESLint passed; 9 test files / 99 tests passed. Previous production build completed in the preceding design turn. A fresh production build is required after this phase.

## Bounded implementation

1. **Foundations:** centralize semantic colors, spacing, frames, focus and reduced-motion rules in a public-scope token sheet; create reusable gate mark and frame primitives without changing private portal styling.
2. **Opening:** replace staged percentage with an honest indeterminate initialization indicator, add an architectural double-door reveal with an emblem on the seam, a skip/recovery control, and reduced-motion bypass.
3. **Public journey:** update hero, gallery, metrics, path, gateways, trust, technology frames and footer to the same art direction; ensure all CTAs route meaningfully. Role gateway context may guide the auth presentation but cannot grant a role.
4. **Access:** unify login, registration and recovery presentation. Preserve real Prisma-backed auth, pending professor approval, admin invite-only entry, errors, sessions and safe authorized redirects. Do not create unsupported verification screens.
5. **Validation:** check 320/375/768/1024/1440 and ultrawide, Arabic and English, keyboard and reduced motion, loader exit, public links, auth form boundaries, typecheck, lint, tests and build. Document observed limitations and stop before private portal redesign.

No migration, package upgrade, production deployment or private dashboard change is planned.
