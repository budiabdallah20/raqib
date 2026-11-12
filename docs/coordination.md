# Coordination — Two Agents (Foundation vs Portals)

> **Rule 03:** phases are sequential. Each agent finishes its phase before owner approves the next.

## Ownership (no file conflicts)
- **Agent A (Out / Foundation)** owns: `prisma/**`, `scripts/**`, `src/lib/{auth,jwt,session,security,crypto,env,csp,db}.ts`, `src/middleware.ts`, `next.config.js`, `server.mjs`, `Dockerfile`, `docs/{project-audit,architecture,database-design,permissions,feature-matrix,implementation-roadmap,security-checklist,coordination}.md`, `src/app/api/{auth,admin,health,public}/**` (security patches only).
- **Agent B (In / Portals)** owns: `src/components/{admin,professor,student}/**`, `src/app/{admin,professor,student}/page.tsx`, `src/app/(auth)/**`, `src/components/{auth,landing,shared}/**` (design tweaks only, no auth logic). Agent B must read `docs/permissions.md` and `docs/database-design.md` before any API/schema assumption.

## Shared contract
- Single academic domain model (Rule 04): an admin-created course → professor section → student enrollment, all from the same tables.
- DB is source of truth — no fabricated records, no localStorage as authoritative store.
- Design tokens: `#0B1120 / #111C32 / #17243B / #2563EB / #8B5CF6 / #263654` + Cairo/Inter, 8px spacing, radius 12-20px, 150-250ms motion. Agent B may gloss the surfaces (shiny black with glow) but must not invent a competing palette.
- Communication: each agent writes its phase report at the end of its phase; the other agent reads it before starting. No silent schema/auth changes.

## PHASE 0 handoff
- PHASE 0 docs done. Owner approved: Neon/Prisma stays, 100% empty purge scope, Phase 0 audit only.
- PHASE 1 (Agent A): migrations baseline + `AcademicYear/Semester/Role/RoleAssignment/CourseSection/TeachingAssignment` + dual-run + backup/purge plan (purge executes only with explicit approval after backup).
- Agent B starts building portal UI against the **current** contract; must re-verify against the new tables after Phase 1 closes. No Phase 2 design system work until owner approves Phase 1 close.