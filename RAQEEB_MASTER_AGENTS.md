# RAQEEB — MASTER MULTI-AGENT DEVELOPMENT DIRECTIVE

> **Status:** Master project specification and execution policy  
> **Agents:** OpenCode (Agent A), OpenAI Codex (Agent B)  
> **Project:** RAQEEB / رقيب — Departmental Academic Operations Platform  
> **Audience:** Faculty of Science, Mathematics & Computer Science Department, Suez University (initial pilot)  
> **Language:** Arabic-first RTL, English-ready  
> **Operating principle:** Build working, secure, connected software—not disconnected mockups.

## 0. MANDATORY FIRST ACTION

Read this entire file, then inspect the **existing repository** and document the actual architecture, working features, dependencies, current database, routes, environment configuration, and unfinished work. **Do not assume the repository is empty. Do not overwrite existing working code.** Inspect `AGENTS.md`, README, package manifests, migrations, and tests if present. Establish a baseline commit and a reproducible build/test report before changes. If there are uncommitted user changes, preserve them and ask before any destructive operation.

This document is the shared specification, **not an automatically running orchestrator**. Two agents cannot coordinate merely by reading it. If an orchestrator does not yet exist, implement and verify one in Phase 0 before claiming autonomous communication. Never claim an agent has communicated, reviewed, or completed work without actual logs and evidence.

### Definition of success

A real user can sign in, land in the correct portal, interact with real persisted academic records, and perform permitted actions across student/doctor/admin workflows. All sensitive data is protected by verified server authorization and database policies. The UI is coherent, polished, accessible, responsive, and fast. Agents can exchange structured handoffs without editing the same files concurrently.

---

## 1. PRODUCT VISION & PILOT SCOPE

Build a premium academic platform called **RAQEEB | رقيب**, initially for the Mathematics & Computer Science Department, Faculty of Science, Suez University. The pilot covers approximately **7 courses** and **11 teaching staff (7 professors + 4 teaching assistants)**. These are planning assumptions, not hard-coded constraints; administrators can configure them.

The product has three interconnected portals:

1. **Student:** enrolled courses, academic schedule, lecture attendance, QR check-in, tasks, assignments, quizzes, marks, progress, notifications, academic materials, and personal reports.
2. **Doctor / Teaching Staff:** course ownership, teaching sessions, rotating QR attendance, enrolled student lists, tasks, assignments, grading, announcements, materials, and exportable reports. Distinguish professor and teaching assistant permissions where needed.
3. **Admin:** identities, roles, staff, students, subjects, terms, schedules, course assignments, policies, attendance oversight, grade governance, system settings, audit history, and reports.

Pilot is **free and narrowly scoped**. Parent accounts, commercial subscriptions, automated essay correction, WhatsApp delivery, and multi-university SaaS belong to later optional phases; design extensibility but do not pretend they are implemented.

### Core product qualities

- One authoritative database and identity system.
- Connected workflows with meaningful state changes and notifications.
- Strong least-privilege security; privacy by design.
- High-end visual identity without sacrificing accessibility or performance.
- Arabic RTL as a first-class experience; optional English LTR.
- Graceful empty, loading, error, offline, and permission-denied states.
- Configurable academic years, semesters, subjects, staff and grading rules.
- No fabricated statistics, fake success messages, fake QR validation, or placeholder-only actions in production paths.

---

## 2. REFERENCE & ART DIRECTION — BUDI PORTFOLIO → RAQEEB

**Reference:** https://budi-portfolio-dev.vercel.app/

Agent A must open the live reference using available browser tools and inspect desktop/mobile layouts, typography, motion, header, section transitions, surfaces, buttons, card treatments, framing, and visual hierarchy. If browser access is unavailable, inspect any locally supplied BUDI source/screenshots; otherwise document that the reference could not be fully inspected and implement the design direction below without inventing exact visual details.

**Do not copy source code, proprietary images, or trademarked assets from the reference.** Reinterpret its premium dark/purple, framed museum-like aesthetic as an original university product.

### Creative concept: THE ACADEMY OF KNOWLEDGE

Imagine a modern educational theater joined with a prestigious digital museum. The landing page is a curated journey through academic halls: a cinematic **Academic Stage** hero, framed displays for product capabilities, glowing gateways for the three roles, and a ceremonial portal-entry experience. The mood should be intelligent, credible, welcoming, and premium—not a fantasy game or nightclub.

**Visual language**

- Deep midnight/navy foundations; refined violet/plum accents; restrained champagne/gold for academic prestige; cyan/emerald only for semantic states.
- Elegant Arabic typography with readable Latin companion; verify font licensing and loading.
- Layered arches, subtle auditorium geometry, lecture hall silhouettes, abstract mathematical grids, thin decorative borders, tasteful framed section titles.
- Frosted glass only where contrast remains high; textured depth rather than excessive blur.
- Carefully designed icons, original logo mark, official technology/course icons where licensed and appropriate.
- Subtle motion with Framer Motion, CSS and optional GSAP only when justified. Respect `prefers-reduced-motion`.
- Avoid expensive WebGL/Three.js and constant particle systems by default. Optimize for modest student phones.
- Design tokens for colors, spacing, radii, shadows, typography, motion durations and breakpoints; support dark/light where practical.

**Suggested token starting point (adjust after accessibility testing):**

```css
:root {
  --rq-bg: #090c18;
  --rq-surface: #13182a;
  --rq-surface-raised: #1b2137;
  --rq-primary: #8b5cf6;
  --rq-accent: #c7a56a;
  --rq-text: #f5f5fa;
  --rq-muted: #b5bfd3;
  --rq-success: #22c55e;
  --rq-danger: #ef4444;
  --rq-radius: 1.25rem;
}
```

These are **draft tokens**, not a mandate to use inaccessible combinations. Check WCAG contrast and focus visibility.

### Landing page — original premium experience

1. **Preloader:** branded RAQEEB monogram or academic seal, lightweight short transition, skip/reduced-motion support, no blocking artificial delay.
2. **Sticky navigation:** brand, platform features, how it works, portals, about, support, language/theme, and sign-in CTA. Functional mobile menu.
3. **Hero / Academic Stage:** auditorium-inspired background, architectural arch and spotlight treatment, strong Arabic headline, animated but readable subheadline, CTAs for `Explore the Platform` and `Sign In`, credible supporting copy. No invented institutional endorsement.
4. **Trust / introduction:** clearly label departmental pilot and its purpose; avoid false official university affiliation claims without approval.
5. **Framed feature gallery:** academic schedules, QR attendance, grades, assignments, alerts, security, course materials, and reports. Each frame has purposeful interactions, not just hover effects.
6. **Three portal gateways:** Student, Teaching Staff, Admin; each has distinct iconography, responsibilities, short feature preview, and role-aware CTA. Do not offer unrestricted self-registration as admin.
7. **How it works:** a concise 3–5 step journey with realistic screens and privacy-safe example data.
8. **Workflow demonstration:** student checks in → doctor verifies → admin sees aggregate audit; demo must be labeled as demo if not live.
9. **Academic metrics:** only database-backed counters, otherwise clearly marked sample metrics or omit.
10. **FAQ / support / contact:** accessible accordion, functional support submission with abuse protection and privacy notice.
11. **Footer:** navigation, legal pages, accessibility, copyright, contact, version/status only when verified.

**Innovative enhancements:** chapter-like scroll progression, framed section headings, magnetic micro-interactions only for pointer devices, role preview cards, meaningful page transitions, skeleton loaders, keyboard navigation, tasteful ambient gradients, clear empty states. Use originality and restraint. No animation should obstruct a task.

### Authentication / onboarding: THE ADMISSION FRAME

- Present login/registration inside a premium architectural **framed panel** or academic invitation card, with elegant depth and a legible form.
- Include email/password, password visibility, validation, forgot password, verified email flow, accessible error messages, loading and rate-limit feedback.
- Provide invite-based student/staff onboarding or admin-approved enrollment. **Never allow a user to select or grant themselves `admin` or `doctor` roles via client input.**
- Student identity, academic number and course enrollment require server-side verification; no unaudited free-text trust.
- Post-auth redirect must come from server-authorized role claims/profile and permitted route rules, not a client-selected dropdown.
- Keep auth UI ownership with Agent A, auth logic/policies with Agent B, using a shared typed contract.

---

## 3. PLATFORM EXPERIENCE — SHARED DESIGN LANGUAGE

All three portals must feel like distinct wings of the same academy. Use a consistent app shell with responsive sidebar, topbar, breadcrumb, command/search entry point, profile, notifications, accessibility and account settings. Avoid over-crowding. Each portal has role-specific accent motifs but shares tokens and components.

### Common platform components

- `PortalShell`, `PortalSidebar`, `Topbar`, `SectionFrame`, `StatCard`, `CourseCard`, `DataTable`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`, `PermissionGate`, `NotificationCenter`, `ActivityTimeline`, `ExportMenu`.
- Forms with schema validation, clear inline errors, accessible focus and keyboard handling.
- Filters, sort, pagination, debounced search, and URL-persisted view state where useful.
- No meaningless charts: prioritize actionable counters, progress rings, attendance ratios, timelines, and compact tables.
- All data surfaces handle server errors, stale data, permissions, and optimistic-update rollback.

---

## 4. STUDENT PORTAL — DETAILED FEATURES

**Dashboard:** greeting and student identity, current term, registered subjects, today's timetable, next lecture, attendance summary, deadlines, recent grades, alerts, and quick actions. Data must be scoped to the signed-in student.

**Course enrollment:** list eligible subjects by academic level/term, enrollment rules, capacity/approval if configured, registration status, conflicts, withdrawal windows, and prerequisite logic when applicable. Never allow arbitrary enrollment in unauthorized subjects.

**My Schedule:** weekly/day calendar, lecture time/place/instructor, status (scheduled/held/cancelled/rescheduled), links to materials, per-course held/attended/absent/excused counts, reminders, and calendar-friendly exports if justified.

**QR Attendance:** student opens scanner on phone or supported webcam, permission fallback, manual token entry where policy permits, validates active lecture window, enrollment, expiry, one-use/replay rules, and records server-side check-in. Clear accepted/rejected/pending states. Never trust QR content as proof of identity; use authenticated session. Include accessibility alternatives and instructor-controlled exceptions.

**Tasks & Assignments:** view tasks issued by staff, due dates, attachments, instructions, submission status, rubric and feedback. Pilot may use read-only tasks initially; submissions must be deliberately scoped and implemented end-to-end if enabled.

**Grades:** midterm, quizzes, assignments, practical, final where applicable; weight configurations, missing/unpublished grades, calculation breakdown, expected grade as an **estimate** not official result, and student-visible publication controls.

**Study Hub:** course files, lecture notes, search/filter, reading history, favorites, safe downloads, revision checklist, and optional personal study planner.

**Notifications:** new task, class reschedule, attendance correction, grade publication, announcements, actionable deep links and read state.

**Profile / Privacy:** editable allowed fields, immutable verified identifiers, password reset, session management, language/theme, and request for correction of inaccurate records.

---

## 5. DOCTOR / TEACHING STAFF PORTAL — DETAILED FEATURES

**Dashboard:** assigned subjects, upcoming lectures, recent attendance, pending grading, submissions, student engagement, announcements and shortcuts.

**Course management:** only assigned courses; roster, course info, teaching schedule, course material uploads with file-type/size restrictions, lecture history, and assistant access based on explicit grants.

**Lecture lifecycle:** create scheduled lecture, activate session, show short-lived signed QR code, rotate token periodically, close session, mark cancelled/rescheduled, and reconcile attendance. Record who changed what and when. Support manual corrections with reason and audit log.

**Attendance console:** real-time counts and roster (present/absent/excused/pending), check-in events, duplicate rejection, anomalies, manual override approvals, per-student/course exports.

**Tasks & assessments:** create/edit/publish tasks, instructions, attachments, due dates, visibility, grading rubrics, optional submissions, quizzes where implemented, feedback, grade draft/publish workflow. Grade edits after publication should be audited and may require approval.

**Marks & reports:** per-assessment marks, configurable weights, validation of maxima, bulk import with preview and error report, export CSV/PDF when available, summary counters without leaking unrelated courses.

**Communication:** course announcements, targeted notifications, office-hour information, support requests. Do not implement unmoderated direct messaging by default.

**Professor vs teaching assistant:** explicitly model course permissions for lecture creation, grading, grade publishing, and overrides. Do not treat all staff as globally privileged.

---

## 6. ADMIN PORTAL — DETAILED FEATURES

**Overview:** accurate student/staff/course counts, active lectures, attendance anomalies, pending requests, audit highlights, system status; filter by term and course.

**Identity & permissions:** invite/approve users, verify identities, grant/revoke scoped roles, suspend accounts, manage professor/assistant assignments. Admin privileges require privileged server-side operation and audit.

**Academic structure:** departments, academic years, terms, courses, sections, cohorts, enrollments, rooms, lecture schedules, conflict checks, configurable grading policies and attendance thresholds.

**Staff & student management:** directory, filters, detail panels, bulk import preview, export with access checks, status history, data correction workflows, avoid accidental irreversible deletion.

**Attendance governance:** anomalies, exception requests, corrections, approval chains, threshold alerts, per-course reports.

**Grade governance:** grading schemes, publication windows, exception approvals, change history, dispute tracking. Admin should not silently alter grades without recorded reason.

**Content & operations:** announcements, support inbox, feature flags, system settings, audit logs, backup/export procedures, retention controls, security alerts.

**Reports:** by course, term, instructor, cohort; CSV/PDF exports; clear timestamps and source filters; no sensitive information in public metrics.

---

## 7. CONNECTED END-TO-END WORKFLOWS (NON-NEGOTIABLE)

### A. Enrollment
Admin defines course and assigns staff → eligible student enrolls or is enrolled → enrollment row persists → student schedule updates → doctor roster updates → notification event emitted → audit trail records privileged changes.

### B. QR attendance
Doctor creates lecture → server generates expiring, signed session token → doctor displays rotating QR → enrolled student scans while authenticated → server validates lecture, time, enrollment, anti-replay and duplicate rules → attendance recorded transactionally → doctor live roster updates → student attendance counters update → admin reports reflect result.

### C. Assignment
Doctor publishes assignment → enrolled students receive notification → student sees task and due date → optional submission persists with safe storage policies → doctor grades → grade published → student sees feedback → reports recalculate.

### D. Grades
Admin configures grading scheme → authorized staff enters marks → validation and draft state → authorized publication → student sees official published marks and separate calculated estimate → revisions audited.

### E. Schedule change
Authorized staff/admin changes lecture → conflict check → schedule updated → enrolled students notified → history and audit preserved.

For each workflow: document events, tables, API boundaries, validation, permissions, error paths, idempotency, and integration tests. **No fake linkage using hard-coded arrays or browser-only localStorage.**

---

## 8. TECH STACK & ARCHITECTURE

Prefer current supported stable versions compatible with the existing project; **inspect versions before upgrading**. Suggested stack:

- Next.js App Router, React, strict TypeScript.
- Tailwind CSS, shadcn/ui, Radix primitives, lucide-react.
- Framer Motion for restrained UI motion.
- React Hook Form + Zod.
- TanStack Query for client server-state when justified.
- Zustand only for genuinely shared ephemeral client state; do not duplicate server truth.
- Supabase PostgreSQL, Auth, Storage, Realtime where needed, RLS.
- Supabase SSR-compatible auth patterns; server actions/route handlers with validated boundaries.
- Vitest + Testing Library; Playwright E2E; lint/typecheck/build; dependency scanning.
- Optional transactional email with approved provider; do not assume credentials.

### Recommended directories (adapt existing structure)

```text
app/
  (public)/
  (auth)/
  (student)/student/
  (doctor)/doctor/
  (admin)/admin/
  api/
components/
  ui/
  shared/
  landing/
  auth/
features/
  attendance/
  courses/
  enrollments/
  lectures/
  assignments/
  grades/
  notifications/
  reports/
lib/
  auth/
  supabase/
  permissions/
  validation/
  audit/
supabase/
  migrations/
  seed/
tests/
  unit/
  integration/
  e2e/
docs/
orchestration/
```

### Data model — initial entities

`profiles`, `roles`, `user_role_assignments`, `departments`, `academic_years`, `terms`, `courses`, `course_sections`, `staff_course_assignments`, `enrollments`, `lecture_sessions`, `attendance_records`, `attendance_corrections`, `assignments`, `assignment_submissions`, `assessments`, `grade_items`, `grade_publications`, `course_materials`, `announcements`, `notifications`, `audit_logs`, `support_requests`, `system_settings`.

Design PK/FK, unique constraints, indexes, timestamps, soft deletion where justified, enum/check constraints, audit policies and retention. Avoid duplicating Auth identities. Use typed migrations and generated DB types. Database changes are owned by Agent B and reviewed before merge. Seed **synthetic** pilot data, never actual student data in fixtures.

### Security checklist

- Verify authentication and authorization **server-side on every operation**.
- RLS for each table; explicit student/self, assigned staff/course, admin scopes; test deny-by-default.
- No role escalation via user-writable metadata, profile fields or registration form.
- Service-role secrets stay server-only and must not be used as a general bypass.
- Validate all input; enforce object-level access and file storage policies.
- Rate limit auth and high-risk endpoints; prevent enumeration; secure password reset.
- Use signed, expiring, non-replay QR attendance with duplicate protections and clock tolerance.
- A QR proves possession of a code, **not physical presence**; document residual risk and optional supervised checks.
- Avoid storing raw secrets, tokens, personal data or QR payloads in logs.
- Apply security headers, CSP compatible with deployment, safe redirects, CSRF defenses where applicable.
- Use transactional writes for multi-table state changes; idempotency for retries.
- Audit role changes, grade changes, attendance corrections and privileged exports.
- Privacy, retention, least privilege, secure backups and recovery plans.
- Production DB migrations, mass deletion, privilege grants and deployment require human approval.

---

## 9. AGENT OWNERSHIP — STRICT RESPONSIBILITY MATRIX

### AGENT A — OPENCODE: EXPERIENCE / BRAND / FRONTEND

**Owns:** brand identity and original RAQEEB logo, design tokens, landing page, loader, public sections, auth form presentation, reusable UI primitives, shared navigation visual shell, responsive behavior, visual QA, animations, accessibility, localization UI, and Storybook/component previews if practical.

**Primary directories:** `components/landing`, `components/auth`, `components/ui`, `app/(public)`, presentation portions of `app/(auth)`, `styles`, brand assets and `docs/DESIGN_SYSTEM.md`.

**Must not:** edit migrations, invent auth contracts, grant roles, bypass permission checks, overwrite portal business logic, or modify production secrets.

### AGENT B — CODEX: PLATFORM / DATA / PORTALS

**Owns:** application architecture, Supabase schema/migrations/RLS, authentication/session logic, API contracts, role routing, Student/Doctor/Admin portal modules, academic workflows, server validation, notifications, audit logs, integration tests, security review and CI quality gates.

**Primary directories:** `features`, `lib/auth`, `lib/supabase`, `lib/permissions`, `app/(student)`, `app/(doctor)`, `app/(admin)`, `app/api`, `supabase`, `tests/integration`, `docs/API_CONTRACTS.md`, `docs/DATABASE_SCHEMA.md`.

**Must not:** redesign Agent A's public components without coordination; hardcode incompatible design styles; bypass the shared design system.

### Shared areas and interface contracts

- Agent A creates presentational `AuthForm` and design primitives; Agent B provides typed auth actions, schema, error mapping and redirects.
- Agent A defines visual `PortalShell`; Agent B integrates role-specific navigation and permissions.
- Agent B publishes DTOs, API schemas, DB types and authorization rules before Agent A consumes them.
- Shared files (`package.json`, `app/layout.tsx`, global styles, shared types, config) require an explicit owner/lock for each task.
- Cross-ownership changes require a handoff and approved ownership transfer; no simultaneous edits.

---

## 10. REAL MULTI-AGENT COORDINATION — NOT ROLEPLAY

### Phase 0: verify tools

Check installed Git, Node, package manager, `opencode --version`, `opencode run --help`, `codex --version`, `codex exec --help`, authentication status and permissions. Do not log credentials. Use installed/documented commands rather than inventing flags. OpenCode supports scripted `opencode run`; Codex supports scripted `codex exec` in appropriate installations. If desktop-only integrations lack CLI access, report the limitation and offer a manual handoff mode until CLI is available.

### Build the orchestrator

Implement a small **local Node.js/TypeScript coordinator** in `orchestration/` with:

- A validated task DAG, durable SQLite (preferred) or atomic JSON state store, task ownership and exclusive locks.
- Child-process adapters for OpenCode and Codex CLI, with per-task cwd, timeout, cancellation, bounded retries, exit code, stdout/stderr capture and redaction.
- Separate Git worktrees/branches for tasks. Never have both agents write into the same working directory.
- Structured task payloads and handoffs, saved to `orchestration/handoffs/` and coordinator state.
- Message types: `TASK_ASSIGNED`, `TASK_ACCEPTED`, `QUESTION`, `ANSWER`, `BLOCKED`, `CONTRACT_CHANGED`, `HANDOFF`, `REVIEW_REQUEST`, `REVIEW_RESULT`, `TASK_COMPLETED`, `INTEGRATION_FAILED`.
- Task fields: `id`, `title`, `owner`, `priority`, `dependencies`, `allowed_paths`, `acceptance_criteria`, `status`, `branch`, `commit`, `test_results`, `messages`, `updated_at`.
- A single integration queue that cherry-picks or merges validated branches after conflict detection and approval gates.
- A clear CLI such as `npm run agents:plan`, `npm run agents:run`, `npm run agents:status`, `npm run agents:review` (implement scripts; do not pretend they already exist).
- Human approval for destructive commands, production DB changes, secrets, privilege escalation and deployment.

**Important:** Reading this document in two interactive windows does not provide automatic messaging. The orchestrator must be implemented, launched, and tested. If unavailable, agents should create handoff documents and ask the human operator to relay them. Never fabricate conversation between agents.

### Example structured handoff

```json
{
  "type": "HANDOFF",
  "task_id": "AUTH-UI-02",
  "from": "opencode",
  "to": "codex",
  "summary": "Auth form UI implemented using agreed contract",
  "branch": "agent/opencode/auth-ui",
  "commit": "<actual-commit-sha>",
  "contracts": ["docs/API_CONTRACTS.md"],
  "tests": ["<actual-test-results>"],
  "questions": ["Confirm server error mapping"]
}
```

Do not fill example placeholders with invented evidence. Record actual commits/tests only.

### Agent-to-agent continuation protocol

1. Agent finishes task, commits and records changed files, decisions, tests and remaining issues.
2. Coordinator forwards the handoff to the dependent agent.
3. Recipient checks out or integrates the approved commit in an isolated branch and verifies contracts.
4. Recipient may request clarification; coordinator routes the message.
5. Reviewer runs checks and either approves or returns actionable issues.
6. Integration agent merges only after passing required checks.
7. Update task state and project decision log.

---

## 11. EXECUTION ROADMAP — IN ORDER, WITH PARALLEL LANES

### PHASE 0 — Discovery, preservation and orchestration (Codex lead; OpenCode assists)

- Inspect repository, baseline tests, list risks and existing features.
- Verify both agent CLIs and their permissions.
- Establish worktrees, coordinator, tasks and message protocol.
- Prove a **real** small task: Agent A edits isolated UI → sends handoff → Agent B reviews diff → tests run → integration succeeds.
- If automation fails, stop and report before claiming dual-agent operation.

**Gate:** actual communication logs, real commits, no file conflicts, verified tests.

### PHASE 1 — Architecture and visual direction (parallel)

- **Codex:** role matrix, architecture, DB ERD, API DTOs, auth/session flow, migration plan, route structure, security threat model.
- **OpenCode:** inspect BUDI reference, produce original RAQEEB art direction, design tokens, responsive component inventory, logo concepts, typography, motion plan and low-fidelity page map.
- Exchange `DESIGN_SYSTEM.md` and `API_CONTRACTS.md`; agree on integration boundaries.

**Gate:** contracts accepted by both agents; no conflicting route/type assumptions.

### PHASE 2 — Foundations (parallel, with dependencies)

- **Codex:** project infrastructure, Supabase local dev, migrations, RLS tests, auth services, role assignment, course/enrollment schema, protected routes.
- **OpenCode:** landing page shell, header/footer, hero, loading transition, portal gateway cards, shared UI kit, auth presentation.
- Codex publishes typed auth contract before UI wiring.

**Gate:** real auth works, unauthorized access denied, landing responsive, build passes.

### PHASE 3 — Portal shells and academic core (parallel)

- **Codex:** Student/Doctor/Admin route shells, dashboard queries, course enrollment, lecture schedule, staff assignments and RBAC.
- **OpenCode:** shared portal shell visual treatment, dashboard cards, responsive tables, skeletons, empty states, charts-free progress displays and accessibility.
- Integrate shared components through reviewed commits.

**Gate:** each role sees correct navigation and only permitted data.

### PHASE 4 — Attendance and academic workflows (Codex lead; OpenCode UI support)

- Secure lecture lifecycle and QR attendance, roster and real-time updates.
- Student course attendance views, teacher correction flow, admin oversight.
- Tasks/assignments, materials, grades, notifications and audit events.
- OpenCode polishes scanners, attendance feedback, forms, progress states and mobile usability.

**Gate:** E2E tests for all five workflows in Section 7.

### PHASE 5 — Advanced experience and reporting (parallel)

- **OpenCode:** refined stage visuals, animations, visual regression, mobile polish, Arabic/English typography, reduced motion, theme variants if stable.
- **Codex:** filtered reports, exports, grade publication, admin approvals, notification reliability, indexes, query optimization and security hardening.

**Gate:** measured performance and accessibility; no critical security failures.

### PHASE 6 — Final integration, pilot readiness (both)

- Full typecheck, lint, unit/integration/E2E tests, build, dependency audit.
- Test with synthetic users for all roles and adversarial unauthorized requests.
- Verify backup/restore plan, rollback, operational logging and documentation.
- Create demo script, admin setup guide, `.env.example`, deployment checklist.
- Request human approval before any production release or real-data import.

**Gate:** evidence-backed release report and explicit human sign-off.

---

## 12. DETAILED INITIAL TASK BACKLOG

| ID | Owner | Task | Dependencies | Acceptance |
|---|---|---|---|---|
| ORCH-01 | Codex | Repository audit and baseline | None | Audit + clean baseline |
| ORCH-02 | Codex | Orchestrator and worktrees | ORCH-01 | Real CLI adapters |
| ORCH-03 | Both | Cross-agent proof of concept | ORCH-02 | Logged real handoff |
| ARCH-01 | Codex | Data model, auth and RBAC contracts | ORCH-03 | Reviewed schemas |
| UI-01 | OpenCode | BUDI reference audit + RAQEEB visual system | ORCH-03 | Tokens + responsive design |
| UI-02 | OpenCode | Logo, preloader, stage hero | UI-01 | Accessible, performant |
| UI-03 | OpenCode | Full landing page + gateway frames | UI-01 | Functional navigation |
| AUTH-01 | Codex | Supabase Auth, invite roles, protected routing | ARCH-01 | Authorization tests |
| AUTH-02 | OpenCode | Framed auth UI | UI-01, AUTH-01 contract | Form + error states |
| DB-01 | Codex | Academic schema, RLS, seeds | ARCH-01 | Migration + RLS tests |
| SHARED-01 | OpenCode | Portal shell and shared components | UI-01 | RTL/mobile/a11y |
| STU-01 | Codex | Student dashboard, enrollment, schedule | DB-01, AUTH-01, SHARED-01 | Real student-scoped data |
| DOC-01 | Codex | Doctor dashboard, course roster, lectures | DB-01, AUTH-01, SHARED-01 | Course-scoped data |
| ADM-01 | Codex | Admin directory, assignments and settings | DB-01, AUTH-01, SHARED-01 | Admin-only permissions |
| ATT-01 | Codex | Secure QR attendance lifecycle | STU-01, DOC-01 | Anti-replay E2E |
| TASK-01 | Codex | Tasks, materials, submissions | STU-01, DOC-01 | Persisted workflows |
| GRADE-01 | Codex | Grade rules, drafts, publication | TASK-01 | Verified calculations |
| NOTIF-01 | Codex | Notifications and announcements | DB-01 | Scoped delivery/read state |
| REP-01 | Codex | Reports and audit governance | ATT-01, GRADE-01 | Correct scoped exports |
| POLISH-01 | OpenCode | Mobile polish, motion, localization | UI-03, SHARED-01 | UX/a11y review |
| QA-01 | Both | Security, E2E, integration, pilot readiness | All required | Evidence-backed signoff |

**Parallelization:** schedule only tasks whose dependencies are complete. Prefer small PR-sized changes. Codex may delegate presentational tasks to OpenCode via the coordinator; OpenCode may request Codex changes to API contracts. No agent can silently change the other's ownership.

---

## 13. ENGINEERING & UX ACCEPTANCE CRITERIA

- Strict TypeScript; no unexplained `any` or `@ts-ignore`.
- No dead buttons, decorative controls masquerading as functionality, or invented data in operational dashboards.
- No secrets committed; `.env.example` documents variables without values.
- Each mutation includes validation, auth, authorization, error handling and audit where sensitive.
- RTL layout works at 360px, tablet and desktop; LTR remains viable.
- Keyboard access, visible focus, semantic labels, reduced motion, sufficient contrast.
- Loading, empty, offline, forbidden, expired session and server-error states are intentionally designed.
- Prevent accidental duplicate submissions; implement optimistic rollback where used.
- No N+1 queries or unbounded data tables; paginate and index appropriately.
- No production data used for screenshots or fixtures without consent and redaction.
- Test role boundary violations, forged QR tokens, expired QR, duplicate scans, unauthorized grade changes, cross-course access and malicious uploads.
- Measure Core Web Vitals / Lighthouse when tooling available; optimize based on evidence, not unsupported performance claims.

---

## 14. REQUIRED PROJECT DOCUMENTS

Create/update these in the repository:

```text
AGENTS.md                         # concise universal agent instructions linking here
RAQEEB_MASTER_AGENTS.md           # this document
README.md                         # setup and product overview
docs/ARCHITECTURE.md
docs/DESIGN_SYSTEM.md
docs/API_CONTRACTS.md
docs/DATABASE_SCHEMA.md
docs/SECURITY_MODEL.md
docs/ROLE_PERMISSION_MATRIX.md
docs/WORKFLOWS.md
docs/TEST_PLAN.md
docs/DEPLOYMENT_CHECKLIST.md
docs/DECISIONS.md
orchestration/tasks.json
orchestration/handoffs/
orchestration/reports/
.env.example
```

Use real decisions and actual implementation details. If an item is pending, label it `PLANNED`, not `IMPLEMENTED`.

---

## 15. REPORTING FORMAT AFTER EVERY PHASE

Report in Arabic (technical terms may remain English):

1. Phase and task IDs.
2. Which agent actually executed each task.
3. Files changed and commit/branch identifiers.
4. Contracts exchanged and actual message IDs.
5. Tests run, exact results, unresolved failures.
6. Screens/routes/features that can be demonstrated.
7. Security issues and mitigations.
8. Blockers requiring owner decisions.
9. Next ready tasks and dependency status.

Do not claim completion based on code generation alone. A feature is complete only when it works with persistent data and passes appropriate tests.

---

## 16. INNOVATION MANDATE — CREATIVE BUT DISCIPLINED

Both agents should propose thoughtful improvements beyond the listed features, but classify each as `MUST`, `SHOULD`, or `LATER`. Prioritize high-value pilot enhancements such as:

- Today's academic briefing and deadline prioritization.
- Intelligent schedule conflict detection (rule-based, not falsely branded AI).
- Attendance anomaly review and transparent correction requests.
- Lecturer quick-start workflow to begin class and generate QR in seconds.
- Student progress insights with transparent calculations and no invented predictions.
- One-click course summary exports with access controls.
- Bulk enrollment import with validation preview and rollback plan.
- Role-specific command palette and contextual quick actions.
- Notification digests and quiet hours.
- Accessibility-friendly fallback attendance for students without camera access.
- Helpful first-run onboarding and guided empty states.
- Optional local AI-assisted marking research **only in a future opt-in phase** with human review, explicit privacy safeguards, and no student data sent to an unapproved model.

Avoid scope creep: finish secure connected core workflows before optional AI, payments, parent portal or SaaS monetization.

---

## 17. IMMEDIATE EXECUTION COMMAND TO BOTH AGENTS

**Start now, but do not skip gates.**

1. Read this file completely and inspect the actual repository.
2. Report what already exists, what is broken, and what must be preserved.
3. Verify whether autonomous OpenCode↔Codex orchestration is truly available; implement/test it if not.
4. Produce architecture, ownership boundaries, shared contracts, design audit and task DAG.
5. Run the cross-agent proof of concept with real commits and handoff logs.
6. Begin Phase 1 and then advance through phases only after acceptance gates pass.
7. Build a premium, original, academically credible RAQEEB experience inspired by the referenced BUDI portfolio **without copying it**.
8. Make the Student, Doctor and Admin portals deeply interconnected through a secure database and verified workflows.
9. Continue autonomously on safe, ready tasks; stop for owner approval on destructive, privileged or production-impacting actions.
10. Always show accurate progress and evidence. Never roleplay a second agent or invent completed work.

**FINAL DIRECTIVE:** Prioritize correctness, security, cohesive design, maintainability and real user value over quantity of code or flashy visual effects. RAQEEB should feel like one carefully designed product, not three unrelated dashboards.
