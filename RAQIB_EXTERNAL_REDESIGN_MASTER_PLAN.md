# RAQIB — EXTERNAL EXPERIENCE REBUILD
## Codex Master Execution Contract | Academic Theater Edition

**Project:** `C:\Users\Administrator\Desktop\raqib`  
**Mission:** Audit, safely clean, stabilize and completely redesign ONLY the public-facing experience: Loading Screen, Landing Page, and Authentication/Registration.  
**Execution mode:** Inspect first, implement in ordered phases, test each phase, and report actual evidence. Do not merely propose changes.

---

## 0. NON-NEGOTIABLE SCOPE & SAFETY

- **IN SCOPE:** loading, landing, login/register, public navigation, shared visual assets used only by these screens, external design tokens, external responsive styles, public accessibility and performance.
- **OUT OF SCOPE:** Student Portal, Instructor/Doctor Portal, Admin Portal; their routes, data flows, components, styles, DB schemas, auth permissions, QR, attendance, grading, APIs and business logic. Do not redesign or refactor them.
- Preserve all existing working routes, authentication flows, role redirects, API contracts, environment variable names, DB/Supabase integration, localization and security boundaries.
- Never delete or replace working code based on filename alone. Trace imports, runtime usage, build references, scripts and git history before removal.
- Never delete `.git`, databases, migrations, user uploads, keys, secrets, or existing `.env` files. Never print secret values in terminal output or reports.
- Never run destructive database commands, migrations, resets, forced git cleans, `git reset --hard`, or mass deletions.
- If project has uncommitted user changes, preserve them. Do not overwrite; report conflicts and work around them.
- Use project’s existing stack/package manager unless a justified change is approved. Do not introduce heavy 3D, large animation engines, unnecessary packages, or a second CSS architecture.
- The public experience should feel like an **Academic Theater**, not a casino, game, entertainment ticket site, or generic SaaS template.
- If uncertain whether a file is used by internal portals, leave it untouched and document the uncertainty.
- Before every phase: state target files and expected effects. After every phase: validate and record results.

## 1. PHASE 1 — BASELINE AUDIT, BUILD & SERVER STABILIZATION (FIRST)

1. Inspect repository root, package manifests, lockfile, framework, runtime versions, routes, dependencies, assets, existing design architecture, auth flows, environment references, build commands and Git status.
2. Determine which files belong to public screens versus shared/internal code. Produce an ownership/dependency map.
3. Run existing lint/typecheck/tests/build where supported and record **baseline failures separately from newly introduced failures**.
4. Check existing dev servers/processes and ports. Do not terminate unrelated processes.
5. Identify project-supported commands for development and production. Prefer a local **production build + production preview** after successful checks; do not label a dev server as production.
6. Clean only verified disposable build artifacts/caches (e.g. `.next`, `dist`, `.vite`, temporary generated output) while respecting project scripts; avoid deleting persistent storage.
7. Resolve build errors and server issues safely without changing portal behavior.
8. Choose an available local port dynamically; report actual URL such as `http://localhost:<actual-port>` only after it is serving. If user needs LAN access, ask before exposing it.
9. Explain that a port is not “encrypted”; HTTPS requires TLS and a certificate or trusted local reverse proxy. For localhost development, HTTP is acceptable. If HTTPS is requested, configure only a supported, validated local TLS option; never falsely call a random port encrypted.
10. Run a smoke test against the real URL and report status, command, PID/process if available, and whether it serves dev or production build.

**Gate 1:** Existing application builds or baseline blockers are documented; no portal regressions; actual working local URL is provided.

## 2. PHASE 2 — SAFE REPOSITORY CLEANUP & CONFIGURATION

1. Inventory Markdown files: paths, sizes, age, references, and purpose. Classify each as KEEP / ARCHIVE / DELETE-CANDIDATE.
2. **Always preserve** `README.md`, `AGENTS.md`, `CLAUDE.md`, architecture notes, security policies, deployment/runbooks, and any Markdown used by tools, docs, CI or team workflows unless explicitly reviewed and approved.
3. Consolidate duplicate/outdated agent-generated notes into one concise canonical document when safe. For unneeded docs, propose a deletion list with evidence and **request approval before deleting**. Prefer moving to a clearly labeled archive directory over irreversible deletion.
4. Find genuinely unused assets and generated artifacts using references and dependency analysis; propose a removal plan. Never remove assets used by any portal.
5. Audit `.gitignore` against actual framework. Ensure relevant secrets, `.env.local`, `.env.*.local`, node_modules, build outputs, caches, logs, OS/IDE temp files are ignored. Preserve committed nonsecret example templates and avoid blanket rules that hide necessary source files.
6. Create/update `.env.example` with **variable names and safe placeholders only**, explaining required vs optional variables; never copy secret values. Preserve real `.env*` contents.
7. Inspect `git ls-files` to detect accidentally tracked secrets; do not expose their contents. If any are found, report remediation and credential rotation requirements rather than silently rewriting Git history.
8. Check package scripts and dependency hygiene. Avoid blind major upgrades and lockfile churn.

**Gate 2:** Cleanup manifest, safe configuration, no broken references, clean lint/typecheck/build relative to baseline.

## 3. PHASE 3 — NEW RAQIB BRAND SYSTEM & LOGO

Design a distinctive, original **RAQIB / رقيب** identity that conveys academic trust, oversight, clarity, and institutional dignity. Integrate a subtle **proscenium arch / stage portal** or spotlight motif with an abstract R / Arabic ر mark. Avoid generic graduation-cap clipart, police surveillance imagery, copied marks and excessive ornamental detail.

**Deliverables:**
- Editable vector SVG logo (full horizontal, icon-only, monochrome/light/dark variants) with transparent backgrounds.
- RTL Arabic and LTR English wordmark treatment, tested for legibility at 24px and 48px.
- Favicon/app icon assets as supported by existing framework.
- Consistent navbar, loader, auth and footer brand usage.
- Use original vector geometry; do not download/copy other institutions' logos. Use existing verified university/faculty assets only if present and authorized; otherwise leave clearly marked placeholders without implying official endorsement.
- Preserve recognizable platform name and accessible alt text.

**Gate 3:** Crisp logo, responsive variants, good contrast and no broken asset paths.

## 4. DESIGN SYSTEM — ACADEMIC THEATER

### Palette (starting point; refine after contrast testing)
- `--stage-obsidian: #101016`
- `--stage-burgundy: #390F20`
- `--curtain-red: #B84535`
- `--spotlight-gold: #D6A35B`
- `--paper-ivory: #F5EBDD`
- `--glass-surface: rgba(255, 247, 240, 0.08)`
- `--glass-border: rgba(245, 235, 221, 0.20)`

Implement scoped public-facing design tokens; avoid altering tokens used by internal portals. Meet WCAG AA contrast where applicable, visible focus, sensible typography and touch targets. Use a consistent spacing and radius scale. Arabic typography and line breaks must be intentionally composed, not an afterthought.

### Visual direction
- Use **realistic, legally usable, locally stored theater photography** for hero and key backgrounds. Do not invent license status; record image source/license. If no approved image is available, create an attractive CSS/SVG stage fallback and ask for a licensed photograph.
- Cinematic burgundy velvet curtains, stage arches, practical amber spotlights, subtle floor/seat geometry, museum-quality frames and believable depth.
- Transparent glass content cards with readable dark scrims. Cards may visually sit above **theater seats**, but do not sacrifice readability or interaction for literal chair shapes.
- Give every section a distinct scene and composition while maintaining one cohesive visual language.
- Subtle glows, spotlights and LED separators only where they improve hierarchy; no constant excessive animation.
- No Three.js or heavy WebGL for public experience. Prefer optimized images, CSS, lightweight SVG and transforms.
- Strong mobile composition; never rely on hover-only interactions.

## 5. PHASE 4 — CINEMATIC LOADING / CURTAIN REVEAL

Create a lightweight, elegant opening sequence:

1. Immediate branded fallback with visible RAQIB logo; avoid blank frames.
2. Optional short logo illumination (~300–500ms) while essential assets load.
3. Two realistic curtain panels slide smoothly outward with subtle easing, revealing the actual landing page beneath. Prefer transform/opacity animation only.
4. Target total intro approximately 0.8–1.5s on normal devices; **never block navigation for a fixed duration if the page is already ready**. Set a safe timeout and failure fallback.
5. Respect `prefers-reduced-motion` by skipping curtain motion; ensure screen reader users aren't trapped.
6. Run only where appropriate (e.g., initial public landing visit), not on every internal route change, login redirect or browser back action.
7. Ensure no layout shift, scroll lock leakage, hydration mismatch, z-index overlay bug, or stale timers.
8. Preload only critical image/logo assets. Defer all noncritical imagery.

**Gate 4:** Loader exits reliably under slow network, image failure, mobile and reduced-motion settings.

## 6. PHASE 5 — REBUILD LANDING PAGE FROM SCRATCH (PUBLIC ONLY)

First map current public page behavior and preserve required links/actions. Replace old public UI styling/components rather than layering new CSS on top. Remove obsolete public styles **only after** verifying no internal usage.

### Scene 01 — Grand Entrance / Hero
- Full-bleed theater photograph: dramatic centered stage, warm beams, dark burgundy foreground, subtle vignette.
- Navbar as floating translucent architectural balcony, new logo, language/theme if existing, clear Login and Get Started actions.
- Hero eyebrow, strong bilingual headline, readable supporting copy and two focused CTAs: `ابدأ رحلتك` and `اكتشف المنصة`.
- Headline idea: `رقيب — حيث يبدأ المشهد الأكاديمي الجديد` (editable copy, not mandatory).
- A framed glass hero centerpiece or stage-door visual that directs attention to role selection.
- Strong semantic hierarchy and intentional composition on 320px mobile through ultrawide.

### Scene 02 — The Three Seats / Roles
- Three elegant role cards: **طالب / عضو هيئة تدريس / مسؤول النظام**.
- Each appears like a curated theater seat or illuminated stage exhibit with a framed glass information panel.
- Concise value proposition, unique icon, accessible button and correct route/auth behavior.
- On mobile stack cards with stable readable layout; keyboard navigable.
- Do not expose admin-only actions or internal details publicly.

### Scene 03 — Academic Journey / How It Works
- Three theatrical steps or illuminated stage stairs: join, participate, progress.
- Use compact numbered cards and connecting LED lines with a nonanimated fallback.
- Describe real existing capabilities only; do not promise unimplemented features.

### Scene 04 — Platform Capabilities / Exhibit Gallery
- Curated frames for actual available capabilities such as schedule, tasks, QR attendance, academic progress **only if verified in project**.
- Prefer authentic UI screenshots/mock illustrations generated from existing UI over misleading stock dashboards.
- Interactive elements must work; no decorative dead buttons.

### Scene 05 — Security & Trust / Backstage
- One premium, concise trust statement; do not claim encryption, compliance, certifications or monitoring that cannot be verified.
- Highlight privacy and role-based access only when actually implemented.

### Scene 06 — Final Invitation / Stage Doors
- Strong closing CTA in a framed proscenium composition; visible login/registration actions.

### Scene 07 — Premium Footer
- Thoughtful layout with new RAQIB logo, useful navigation, verified institutional attribution, developer credit if already authorized, real social/contact links only.
- If authorized logos exist, show them crisply and proportionately. Do not fabricate official sponsorship.
- Subtle moving light ribbon only if low-cost and disabled for reduced motion.
- Footer must feel visually finished, not like a generic afterthought.

**Gate 5:** All sections are complete, purposeful, responsive and linked to real functionality. No legacy styling collisions.

## 7. PHASE 6 — REBUILD AUTHENTICATION & REGISTRATION EXPERIENCE

- Keep **existing authentication logic, session persistence, validation, security checks, redirects, backend endpoints and role permissions** intact.
- Redesign presentation only: a theater lobby / private stage box aesthetic, visible glass form framed by stage arch, tasteful realistic background and strong contrast.
- Make login/register/reset-password flows discoverable if they already exist; do not invent unsupported flows.
- Use clear field labels, error messages, loading states, password visibility toggle if appropriate, accessible validation, and obvious primary action.
- Avoid decorative overlays that cover fields, especially on short laptop screens and mobile keyboards.
- Password managers/autofill must work; do not log credentials; avoid leaking sensitive errors.
- Role selection must never bypass server-side authorization; never trust a client-selected role as proof of privilege.
- Ensure RTL/LTR support, focus management, keyboard access, no horizontal overflow, and touch-friendly forms.
- Verify each existing role can log in and reach the **unchanged** correct portal using safe test accounts if provided; never create privileged accounts without authorization.

**Gate 6:** Auth screens are beautiful, fully usable and secure; existing portal routes remain unchanged.

## 8. PHASE 7 — PERFORMANCE, ACCESSIBILITY, QUALITY

### Performance budget
- Aim for excellent Core Web Vitals; measure instead of inventing scores.
- Compress theater photography to AVIF/WebP where supported; responsive `srcset`/framework image component; reserve aspect ratios; preload hero only; lazy-load below-fold assets.
- Avoid giant videos, autoplay media, heavy blur stacks, scroll-linked JavaScript, parallax on low-power devices and unnecessary animation packages.
- Use CSS transforms and opacity, reduced-motion support and sensible device-dependent fallbacks.
- Check memory leaks, hydration warnings, runtime errors, image failures and route transitions.

### Verification matrix
- Viewports: 320, 375, 768, 1024, 1440, 1920 widths.
- Browsers: Chromium, Firefox and WebKit where available.
- Languages: test Arabic RTL and English LTR; preserve all other existing translations.
- Input: keyboard only, touch, screen reader semantics, focus, contrast, zoom at 200%.
- Network: slow 3G simulation, offline/error fallbacks where applicable.
- Flows: landing -> login -> register (if existing) -> login -> role redirect -> logout; browser refresh and back.
- Security: no secrets in client bundles, no accidental privileged access, no unsafe auth shortcuts.
- Run project-supported lint, typecheck, unit/e2e tests and production build. Fix regressions you introduce.
- Take before/after screenshots if tools permit and compare against stated design goals.

**Gate 7:** No newly introduced errors; all supported checks pass; limitations and baseline failures clearly identified.

## 9. EXECUTION & COMMUNICATION PROTOCOL

- Work **sequentially**: Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7. Never skip baseline verification.
- Implement actual changes; do not stop at generic suggestions.
- At start of each phase, print: `PHASE X / 7 — Goal — files to change — risks`.
- At end, print: `Completed / Checks run / Results / Remaining blockers`.
- Ask permission only for genuinely destructive operations, missing image/logo rights, credential-dependent actions, or choices that cannot safely be inferred.
- If task exceeds one agent session, write a concise checkpoint in the canonical project plan: completed tasks, modified files, remaining work, known failures and next command. Do not spawn many redundant MD reports.
- Keep commit-sized changes and preserve rollback capability. Do not auto-commit unless asked.
- Do not claim completion based on source changes alone; run and verify.

## 10. REQUIRED FINAL DELIVERY REPORT

Provide:

1. **Scope summary:** what changed in loading, landing, auth; confirmation internal portals were untouched.
2. **Cleanup inventory:** retained, archived, proposed deletions, and any approved deletions actually performed.
3. **Environment & Git:** `.gitignore`/`.env.example` changes, secret exposure warnings without values.
4. **Logo/assets:** paths and licensing status of imagery.
5. **Server:** actual working localhost URL, port, protocol (HTTP or HTTPS), dev/production mode, startup command, process status.
6. **Quality checks:** exact commands, pass/fail results, baseline issues and new issues.
7. **Performance:** measured results if tools available; otherwise explicitly mark unmeasured.
8. **Open items:** blockers and approval requests, prioritized.

**Definition of done:** A distinctly cinematic, accessible, responsive and performant RAQIB public experience, with verified working routes and authentication, a safe cleaned repository, a new original brand, a functioning server, and zero unintended changes to internal portals.

---

## FIRST ACTION — EXECUTE NOW

Open `C:\Users\Administrator\Desktop\raqib`. Start Phase 1 immediately: inspect project and Git state, determine stack and existing scripts, record baseline, stabilize build, and report a genuinely running local URL. Then proceed through the phases, observing all safety gates. Do not redesign internal portals.

---

## Execution checkpoint — 2026-11-12 — requested burgundy theater redesign

### Scope and ownership
The current user explicitly requested Codex to execute this external-only plan with the two supplied theater images and the exact five-color palette. This is the task-specific ownership assignment for public presentation. No OpenCode process or cross-agent coordination was used or claimed. No commits were created. Starting HEAD: `13215086ecdfb7f99c536c3f2c91fe446165e171`. The working tree already contained extensive tracked and untracked changes.

### Phase 1 — inspected architecture and baseline
- Next.js 15.5.28 / React 19 / TypeScript / Prisma 5.22; existing production configuration uses Neon Postgres. No migration, seed, production data mutation, or auth/API change performed.
- Existing public route: `src/app/page.tsx` performs the existing authorized-role redirect before rendering landing. Existing auth pages retain AuthCard, LoginForm, RegisterWizard, AdminForm, recovery, passkeys and policy dialogs.
- Pre-edit `npx tsc --noEmit`: PASS. `npm run lint`: PASS with four existing warnings. `npm test`: PASS, 10 files / 101 tests.
- Initial build compiled but subsequent type validation included the newly created backup `.tsx` copies. Corrected backup extensions to `.tsx.bak`; this was an execution artifact, not a baseline application failure.
- User work retained. Pre-edit copies of changed existing presentation files are under `work/external-redesign-backup/`; old landing section implementations remain in place.

### Phase 2 — cleanup/configuration inventory
- `work/external-cleanup-inventory.json` inventories 32 Markdown documents with path, size, modification date and disposition. KEEP all: instructions, master briefs, architecture/security/product docs and historical handoffs may still be required.
- Archived: none. Deleted: none. Proposed destructive deletions: none. Old public sections remain available for rollback and are no longer imported by LandingPage; no portal asset was removed.
- Existing `.gitignore` already excludes environment files except `.env.example`, local TLS keys, databases, uploads, dependencies and build outputs. Retained unchanged.
- `git ls-files '.env*' '*.pem' '*.key'` returned only `.env.example`; no actual secret values were printed. This is a filename audit, not a full historical secret scan.
- `.env.example` already has safe sample values and required database/JWT/PII names plus optional email/passkey settings. Retained existing user changes. Its pre-existing corrupted Arabic comments and obsolete demo-reset example remain a documentation cleanup item.

### Phases 3–6 — implementation
- Original editable proscenium/R vector: `public/brand/stage-mark.svg`, light and monochrome variants, `stage-wordmark.svg`, and 32px PNG. Public home/auth metadata use the new SVG icon; portal brand assets are unchanged.
- `StageBrand.tsx` supplies Arabic wordmark plus English label for navbar, lobby and footer; loader and auth-panel badge use the same mark.
- `AcademicTheater.tsx` and `academic-theater.css`: full photographic entrance, navigation/mobile menu, three role gateways, journey, four verified capability descriptions, authorization trust statement, FAQ, photographic final invitation, support mail link and functioning privacy/terms dialogs. Arabic/English copy and RTL/LTR landing; no fabricated metrics or institutional sponsorship.
- `TheaterLobby.tsx` and `theater-lobby.css`: photographic lobby, readable form panel, mobile layout and scoped palette. Existing form handlers/validation/endpoints unchanged. Existing form content remains Arabic; the lobby follows the existing language preference. Full English form translation was not part of the existing forms and is not claimed complete.
- `SplashScreen.tsx`: same bounded first-visit curtain mechanism, updated brand; curtain begins opening at 160ms instead of an 840ms artificial hold. Existing reduced-motion, skip, safety timeout and session behavior retained. Splash palette scoped to the splash itself.
- AuthCard presentation removes developer-oriented footer jargon and fixes an existing `duration: 300` seconds to `0.3` seconds. No permission or account role changes.
- No Student/Professor/Admin portal files, database schema, APIs, auth logic, global tokens or dependencies changed by this task.

### Image provenance
The user supplied both images in this chat and explicitly requested their use. Source files: `codex-clipboard-6508ba0b-83d6-4e3f-a559-356c77dcd616.png` (curtain) and `codex-clipboard-6fffb02f-da77-4001-a0ca-1524150783d2.png` (auditorium). WebP derivatives retain the supplied content: `public/images/theatre/curtain.webp` = 98,128 bytes (700×700); `auditorium.webp` = 122,852 bytes (1536×1024). No independent third-party license was supplied or verified; no claim of stock/public-domain rights. No image generation or watermark removal performed.

### Phase 7 — verification record
- `npm test`: PASS after implementation, 10 files / 101 tests.
- `npm run lint`: PASS after implementation, same four existing warnings: professor board image, professor dashboard image, AvatarUpload image, PomodoroTimer hook dependencies. No new lint warnings.
- `npx tsc --noEmit`: PASS after the new landing/lobby implementation.
- `npm run build`: PASS once; subsequent repeat encountered Windows Prisma DLL lock while the preview server was running. Stopped only the task's own loopback listeners (3210 and 3211), then restarted the full build. Final result recorded below.
- First production browser sweep: 18/18 route/viewport combinations returned HTTP 200 and had zero horizontal overflow: `/`, `/login`, `/register` at 320, 375, 768, 1024, 1440, 1920 widths.
- Functional checks passed for language switching, FAQ, privacy modal, password recovery modal, admin intent/tab, mobile navigation, intro exit and repeat visit. An initial assertion ran before hydration completed and was corrected to wait for the intro removal.
- That sweep also caught React hydration errors on auth routes after source files changed during the prior build. A fresh build from stable source is being verified; these errors are not dismissed as passing.
- Firefox and WebKit binaries are unavailable in the installed Playwright environment. Chromium is available. Real-role credential/login/logout verification remains unperformed because no synthetic test accounts were provided; no production accounts or academic data used.
- Contrast calculations for solid token pairs: ivory/obsidian 16.08:1; gold/obsidian 8.35:1; ivory/burgundy 14.10:1; gold/burgundy 7.32:1. These are token checks, not a claim that every image overlay/control has passed a full accessibility audit.
- New hero image payload is 122,852 bytes. Successful build reported landing first-load JS 127 kB. Core Web Vitals/Lighthouse not yet measured; no score claimed.
- Screenshots and executable browser review: `work/redesign-*.png`, `work/external-redesign-review.cjs`, `work/external-redesign-results.json`.

### Remaining verification / next action
Finish stable production build, restart `npx next start --hostname 127.0.0.1 --port 3211`, rerun `REVIEW_URL=http://127.0.0.1:3211 node work/external-redesign-review.cjs`, resolve any reproducible hydration regressions, and append exact final status. No deployment or Git push requested or performed.

### Final verification — completed 2026-11-12
- Final stable `npm run build`: PASS (exit 0), 77/77 static pages, landing first-load JS 127 kB. Final `npx tsc --noEmit`: PASS (exit 0).
- Production preview restarted at **http://127.0.0.1:3211** with `npx next start --hostname 127.0.0.1 --port 3211`. HTTP loopback only, production mode; not HTTPS, not a deployed public release. The task's development preview at 3210 was stopped.
- Final `REVIEW_URL=http://127.0.0.1:3211 node work/external-redesign-review.cjs`: PASS (exit 0). All 18 route/viewport cases pass; **zero browser page errors**, including zero React hydration errors. Earlier auth hydration warnings disappeared after the stable rebuild.
- `node work/external-resilience-review.cjs`: PASS (exit 0). Keyboard skip navigation works; 200% CSS zoom produces zero horizontal overflow; blocked theater images leave readable usable content; simulated slow connection (400ms latency, 500kbps) exits the intro successfully. Unauthenticated `/student`, `/professor`, `/admin` redirect to login.
- Local single-navigation diagnostic: TTFB 290ms; DOMContentLoaded 742ms; load 1147ms. These are loopback observations under this run, not Lighthouse/Core Web Vitals or production network claims.
- Final artifacts: `work/external-redesign-results.json`, `work/external-resilience-results.json`, `work/redesign-hero-desktop.png`, `work/redesign-auth-desktop.png`, full-page landing/login/register screenshots at 375 and 1440 widths.
- Outstanding limits: Firefox/WebKit executables unavailable; full manual screen-reader audit unperformed; full English translation of pre-existing Arabic auth forms unimplemented; authenticated role login/logout needs authorized synthetic accounts; image third-party licensing independently unverified; pre-existing example-file comment encoding remains. No real-data mutation, deployment, push or commit performed.
- Retained all prior user modifications; no destructive cleanup. External implementation and the available checks are complete. Remaining credential/browser/language checks above are explicitly not represented as completed.
