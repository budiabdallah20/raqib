# RAQEEB — External Experience Rebuild | Master Agent Directive

> **Execution environment:** Existing local repository opened in VS Code with Kilo Code.
> **Run order:** PLAN agent first → obtain approval/switch to BUILD agent → stabilize server and build → implement external redesign → verify and report.
> **Project:** Raqib (رقيب), academic/educational platform.
> **Primary language:** Arabic (RTL), with existing localization preserved.

## 0. ROLE & SUCCESS CRITERIA

Act as a **Principal Frontend Architect, UI/UX Art Director, Senior Full-Stack Engineer, Performance Engineer, and QA Lead**. Work **inside the current repository only**. This is a real production-style refactor, not a concept, mockup, or replacement demo. Produce real integrated code, not just advice or snippets.

Create a polished **Academic Theater / Grand Learning Stage** experience across ONLY three external surfaces:
1. Initial loading / curtain-reveal experience.
2. Public landing page and its externally rendered sections.
3. Authentication, login, registration, recovery, and related public auth UI as currently implemented.

**Success is not visual appearance alone.** Success requires the existing app to launch, compile, render, preserve working auth/navigation/localization, feel responsive, respect accessibility, and pass available checks. The development server must be launched before any visual redesign in BUILD mode, and its actual accessible localhost URL must be reported.

## 1. HARD SAFETY BOUNDARIES — NON-NEGOTIABLE

- **NEVER change code, files, styles, behavior, routes, API contracts, or database policies for internal Student, Instructor/Doctor, or Admin portals.** This includes internal layouts, components, pages, state, dashboards, permissions, and portal-specific CSS.
- Do not modify Supabase schema, RLS, migrations, database data, credentials, environment values, secrets, or deployment configuration unless a directly necessary, safe, scoped fix is explicitly approved.
- Do not replace the project, remove its existing files en masse, change its framework, or rewrite infrastructure as a shortcut.
- Do not delete or overwrite shared `globals.css`, Tailwind settings, theme tokens, providers, layout, or package scripts wholesale. **First map usage**. Replace *only external-scoped* visual rules; preserve global or internal dependencies. Prefer a namespaced theme such as `.external-stage` / `data-experience="theater"`, dedicated CSS modules, or scoped component styles.
- Preserve functional routing, real content, localization, forms, validation, API integration, Supabase authentication, role redirects, accessibility, logging, and existing session management. No mock forms, dummy authentication, placeholder business content, or fake data.
- Preserve names and public contracts where other code depends on them. Refactor only where needed and update affected references.
- Never expose environment values, tokens, connection strings, credentials, or user data in terminal output, reports, screenshots, or git diffs.
- Prefer the current package manager and lockfile. Add only justified compatible dependencies. Never run destructive cleanup (`rm -rf` on broad directories, database reset, forced git clean, blanket dependency upgrades) or terminate unrelated processes.
- If a blocker originates within a protected portal, report it precisely rather than violating this boundary. If a shared fix is strictly unavoidable, explain the impact and ask before proceeding.
- Work incrementally with reversible changes. Do not commit, push, deploy, or publish unless requested.

## 2. PLAN AGENT — INVESTIGATE AND DESIGN BEFORE EDITING

**You are initially in PLAN mode. Do not modify files, install packages, or execute destructive commands in PLAN mode.** If read-only commands are available, inspect safely. Prepare a concise, explicit architectural implementation plan covering:

1. **Repository reconnaissance:** discover package manager, framework/version, route structure, source folders, entrypoints, component hierarchy, style system, fonts/assets/logos, i18n, auth flow, installed UI/motion libraries, tests, and dev/build/lint/typecheck scripts. Read `AGENTS.md`, `agent.md`, `kilocode.md`, and relevant project instructions when present; obey them unless they conflict with the safety boundaries above.
2. **Scope map:** list exactly which files are external and editable, which are shared and require special care, and which portal files are strictly protected.
3. **Dependency map:** identify external uses of shared layout/provider/theme styles; determine a strategy to scope the new visuals without changing internal portals.
4. **Design strategy:** sketch the stage composition, responsive lighting, curtain reveal, top/side spotlights, content hierarchy, component breakdown, staircase registration steps, and auth UX. Include Arabic RTL considerations.
5. **Risk assessment:** likely build/server issues, animation performance, i18n and authentication risks, protected portal regressions, mobile constraints.
6. **Verification strategy:** exact commands for dev server/build/lint/typecheck/tests; browser viewport matrix; functional acceptance checklist; screenshot plan if browser tooling exists.
7. **Sequenced BUILD work plan** with estimates **by relative complexity rather than time promises** and clear quality gates.

**PLAN output must include:** (a) explicit protected/editable file inventory, (b) build/server activation procedure, (c) proposed scoped design tokens, (d) implementation order, (e) test matrix. Then state: **"PLAN COMPLETE — Switch from Plan to Build using Kilo's agent selector (Tab, if available), then continue this task."**

If the environment supports an authorized automatic agent-mode switch, use it; otherwise **do not pretend that mode switching happened**. The human may need to press Tab/change the agent and send **"Execute the approved RAQEEB plan. Begin with Phase BUILD-0: server and build stabilization."**

## 3. BUILD AGENT — PHASE BUILD-0: GET A CLEAN, RUNNING APP FIRST

**This is the FIRST execution phase. No visual redesign before server startup and baseline diagnosis.**

### BUILD-0A — Safe setup and discovery
- Verify project root/current working directory and read relevant package scripts/configs, lockfile, Node requirements, `.env.example` / environment **variable names only** (never values).
- Check for an already-running project dev server. Reuse it when healthy. Otherwise choose the correct command for the detected package manager (npm/pnpm/yarn/bun); install dependencies only if missing and only with compatible versions/lockfile consistency.
- Select an available local port, preferring `3000` unless configured otherwise. On Windows, use portable, supported commands and avoid assuming Bash.
- Start the actual app dev server in a persistent VS Code/Kilo terminal. Do not leave it blocked behind a one-off command that exits. **Do not claim a persistent server if the environment cannot keep the process alive.**
- Capture and report the exact tested URL (for example, `http://localhost:3000`) **only after verifying the app responds**, plus the actual port/process status. Do not invent a port or claim reachability without checking it.

### BUILD-0B — Baseline quality gate
- Run relevant checks discovered in `package.json`: production build; TypeScript type check (`tsc --noEmit` if appropriate); ESLint; test runner; existing Playwright tests where practical. Avoid running any destructive integration tests against production services.
- Inspect actual stdout/stderr and fix root causes, not just surface symptoms. Separate errors from warnings. No hiding with broad `any`, `@ts-ignore`, disabling lint, suppressing console output, skipping checks, or deleting tests.
- Correct errors in editable/external and safe, demonstrably necessary shared paths only. **Do not touch internal portal files.** Log out-of-scope failures accurately and request approval before a fix that violates scope.
- Verify homepage response and browser render if browser capability exists; identify hydration mismatch, missing assets, missing CSS, import issues, runtime errors, redirect loops, 404s, and port conflicts.
- Give a short **BUILD-0 checkpoint report:** actual URL, start command, build/typecheck/lint/test results, errors fixed, any remaining blocked issues, changed files. **Do not label the build clean until it really passes.**
- Keep the dev server usable throughout the redesign. If it crashes, restore it as the immediate priority.

## 4. VISUAL DIRECTION — THE RAQEEB ACADEMIC THEATER

**Design narrative:** a premium, modern academic stage, as if the student is entering a prestigious theater of knowledge. The result should feel meticulously art-directed — not a generic dashboard with burgundy buttons, not a casino, not a children's illustration, and not a visually chaotic heavy 3D scene.

### Palette and strictly scoped design tokens
Create a coherent semantic palette based on these **starting points; tune contrast during implementation**:

- Deep stage / near-black burgundy: `#180B12`
- Primary burgundy: `#641B35`
- Rich burgundy: `#842441`
- Warm burgundy highlight: `#A83F5A`
- Spotlight orange: `#FF914D`
- Amber/copper subtle highlight: `#F5B46B`
- Clean white: `#FFFFFF`
- Warm ivory/off-white: `#F8F5F2`
- Dark ink for light-surface text: `#24151D`

Define **semantic CSS variables** for stage background, panels, readable text, curtain shading, glow, borders, focus rings, hover, elevations, spacing, corner radii, z-index, and motion speeds. Keep text readable on all surfaces, and ensure accessible contrast. Make white/ivory primary reading surfaces against dark theatrical framing so the page is not one dense dark-purple sheet. Never leak external theme tokens into the internal portals.

### Stage architecture / visual composition
- Create a recognizable **proscenium arch** or architectural stage frame: slim architectural contours, elegant ornamental trims, controlled warm rim lighting, layered depth, premium typography, and deliberate composition.
- Add **TWO deliberately composed theatrical spotlights**, one upper-left and one upper-right, clearly visible as tasteful stage fixtures or geometric light sources. Each projects a **soft directional amber/orange beam toward the main hero stage** using GPU-friendly CSS gradients, masks/clips, opacity and transforms. Lighting must sit behind content, remain perceptible without overpowering text, scale correctly on mobile, and use `pointer-events: none`.
- Include subtle stage footlights / floor glow, ambient vignette, atmospheric dust or bokeh **only if inexpensive**, minimal highlights on framed cards, and tasteful scroll-linked glow where performant.
- On far left and right, use elegant **velvet burgundy curtain panels** as framing. Suggest folds realistically with layered gradients, highlights and shadow rather than huge image downloads. The decorative curtains must never trap focus or obstruct buttons. Mobile layout should simplify this framing.
- Keep visual intensity focused on a few signature moments. Use whitespace, alignment, typographic rhythm, consistent frame geometry, and credible editorial layouts. Design first for RTL Arabic and adapt logically for LTR translations.

## 5. THE THREE DELIVERABLE SURFACES

### 5A — CINEMATIC LOADING SCREEN AND CURTAIN REVEAL

Build a deterministic loading experience:
1. A full viewport burgundy velvet curtain, split into left/right panels with realistic folds and depth.
2. Existing official RAQEEB logo/name centered; logo appears first with a soft intentional glow and restrained text movement.
3. Only when app-critical readiness is satisfied, animate the panels parting horizontally outwards, including appropriate stage-light reveal and a controlled transition to the actual landing DOM underneath.
4. Handle fast load and slow load: no white flashes, hydration mismatches, giant layout shifts, arbitrary infinite spinners, repeated curtain replay on every trivial state update, or blocking the user after readiness.
5. Support fresh-visit vs same-session behavior if a lightweight local/session preference already exists or a scoped implementation is warranted. Do not delay every navigation.
6. Respect `prefers-reduced-motion` by using a near-instant non-disorienting transition.
7. Keep the animation concise, optimized for transforms/opacity rather than expensive blur repaints, and responsive at 320px+.

**Acceptance:** entering the public app reads visually as `logo → curtain opens → stage appears` and the page is interactive after reveal.

### 5B — ACADEMIC STAGE LANDING PAGE

Replace **only external page presentation**, preserving actual copy, content, external links, branding assets, and working functionality unless clearly erroneous.

- **Hero:** extraordinary editorial headline, deliberate contrast between headline/subtitle/short description, polished burgundy/white/orange typographic composition, clear CTA pair, stage scenery visible without interfering with text; subtle staggered introduction after the curtain reveal.
- **Navigation:** premium stable header with clear brand, section navigation, sign in/register actions, keyboard focus, active states, mobile navigation, correct RTL direction, sticky behavior without jitters.
- **Feature/services cards:** combine visual language of sculpted theater seats, framed academic certificates, admission tickets, and reserved-stage plaques — without sacrificing scannability. Each card should have an original physical detail (subtle inset bevel, upholstery seam, copper edge, stage-number insignia), meaningful iconography, and reserved shadow/glow. Card hover effects should not move text unpredictably or impair touch devices.
- **Process/registration steps:** **NO standard circular stepper.** Build a responsive **architectural ascending staircase** whose actual content cards align to staggered risers. Steps have semantic numbering, short labels, descriptive text, and orange light accents. On hover, keyboard focus, and scroll-intersection, illuminate the relevant step via a soft focused spotlight. In RTL, the progression and reading order must remain logical. On mobile, gracefully transform into a simple readable stacked stair/timeline variation; don't force horizontal overflow.
- **Other existing sections:** preserve and improve hierarchy, credibility, responsive layout, visual unity, and navigation; do not fabricate platform metrics, testimonials, partners, or guarantees.
- **Microinteractions:** tasteful hover elevation, light sweeps on CTA, staged reveals, active nav illumination, frame shimmer only at key interactions. Reserve theatrical drama for high-value moments.

### 5C — AUTHENTICATION / REGISTRATION STAGE

- Design a theater-admission / invitation-card experience visually related to the landing: framed glass/ivory login panels over a controlled burgundy stage setting, small ornamental details and spotlights, comfortable form density.
- Preserve **real** login, sign-up, reset password, validation, server responses, error states, disabled/loading states, accessibility, password visibility, and correct role-based redirects. Maintain Supabase and existing auth patterns exactly as required by the repository.
- Correct autocomplete fields, semantic `<label>` association, ARIA error guidance, reliable show/hide password, keyboard navigation, and input focus rings. Support Arabic RTL with email/password input direction appropriate to content.
- Design honest success/error/empty feedback. Do not expose whether an account exists when current security behavior avoids it.
- No hard-coded users, bypass roles, fake successful submits, or replacement mock credentials.

## 6. ANIMATION, PERFORMANCE, LIBRARY POLICY

- Inspect existing stack first. Reuse React/Next, Tailwind/CSS, Framer Motion/Motion, icon library, and browser test tools already installed where possible.
- Use **Framer Motion** for intentional page transitions, orchestrated curtain reveal, and modest scroll/hover movement if compatible. **Do not animate every DOM node continuously** or use expensive blanket filters.
- If a package is genuinely missing and justified, install **only the minimal well-supported compatible package(s)**; verify lockfile/install/build. Suggested only when needed: `framer-motion` (or current existing Motion package), `lucide-react` (if there is no icon set), and an existing browser test framework. Avoid redundant animation libraries, massive 3D engines, shader pipelines, external tracking, and unnecessary UI packages.
- Prefer CSS perspective and layered gradients for 3D-like depth. Avoid Three.js/WebGL and large video backgrounds: the site must remain fast on ordinary student laptops and phones.
- Animate primarily transform and opacity. Guard IntersectionObserver/scroll animation overhead, avoid huge blur filters and per-frame layout reads, and disable hover-only behavior on touch devices. Reduce particles, beam intensity, and movement at narrow widths and reduced motion.
- Use semantic DOM, logical heading order, descriptive image alt text, stable focus, sufficient contrast, visible focus indicators, and at least ~44px touch target where practical.
- Maintain responsive quality across `320`, `375`, `768`, `1024`, and `1440` px widths, on both RTL and current supported LTR locale(s).
- Ensure no horizontal overflow, no hidden form controls, no clipped drop-downs, no blocked CTAs, no console errors, and no text overlaps at 200% zoom.

## 7. SAFE IMPLEMENTATION ORDER

After the **BUILD-0 checkpoint** above, work in this strict order:

1. **B1 — Scoped tokens and foundation:** create external-only theme tokens, reset only external legacy presentation, set responsive type, stage layers, RTL support, component geometry, and motion primitives. Confirm internal pages look unchanged by diff review or smoke test.
2. **B2 — Loading screen:** implement logo-first velvet curtain reveal with correct readiness and graceful motion fallback. Verify before progressing.
3. **B3 — Landing shell:** page wrapper, proscenium, bilateral spotlights, curtains, hero, header, and responsive stage lighting. Test 375px/1440px and scrolling.
4. **B4 — Landing components:** feature cards, framed sections, real CTAs, and architectural staircase flow with spotlight interactions.
5. **B5 — Auth pages:** redesign visuals only, preserve all auth logic and routes; verify roles and validation.
6. **B6 — Polish:** performance, keyboard/focus, contrast, mobile, reduced motion, LTR/RTL, loading transitions, image loading, and visual consistency.
7. **B7 — Final validation:** run all appropriate build/type/lint/tests, browse real routes where tooling allows, compare protected file diffs, and confirm persistent server URL.

After each stage, run the fastest meaningful checks and fix new regressions immediately. **Do not proceed if the current stage breaks basic app startup**. Break work into logical commits of changes in the working tree, but do not create git commits without permission.

## 8. TEST MATRIX / QUALITY GATES

**Technical:**
- App is listening at the verified localhost URL.
- Homepage, login, registration, and recovery pages render without runtime errors; navigation and route transitions work.
- Production build passes; typecheck, lint, and existing relevant tests pass where configured.
- No missing modules, hydration mismatch, import errors, obvious CSP violations, missing images, or severe console warnings.
- Portal files unchanged; protected portal smoke checks pass if safe/test accounts are available (do not request or expose secrets).

**Visual and behavior:**
- Curtain sequence feels premium and never blocks navigation indefinitely.
- Both left and right fixtures/spotlight beams are visible on desktop, elegant and nonintrusive on mobile.
- Deep burgundy/amber/white identity coherent across loading/landing/auth.
- Cards evoke theatrical seating/framed academic artifacts without harming readability.
- Registration steps form a believable responsive staircase with scroll/focus light highlighting.
- Keyboard focus, disabled states, forms, RTL typography, reduced motion, and responsive views work.
- No heavy animation jank, unbounded loops, horizontal scrolling, accidental focus traps, or content obscured by overlays.

If Playwright/browser tools exist, perform real UI smoke checks and capture before/after evidence locally. If unavailable, state exactly which checks were not executed; do not fabricate screenshots, scores, or passing tests.

## 9. FINAL REPORT — REQUIRED FORMAT

At completion, report in **Arabic** with exact evidence:

1. **Server:** exact verified `http://localhost:<port>` URL, command, persistent process status, and how to restart if needed.
2. **Baseline:** errors originally present and factual fixes performed.
3. **Implemented:** overview of curtain, bilateral stage lighting, landing, staircase steps, auth redesign, and responsive system.
4. **Files:** explicit list of changed/new files and packages installed (or "none").
5. **Verification:** production build/typecheck/lint/test outcomes including exact command and pass/fail, plus browser routes and viewports checked.
6. **Safety:** proof that Student/Instructor/Admin portals and their file paths were not modified; note any shared changes and why they're safe.
7. **Unresolved:** remaining warnings, environment blockers, untested flows, and risks clearly identified.

**No generic “everything is perfect” claim without evidence. No stopping at plans or mockups once BUILD mode has been authorized. Keep the running server accessible.**

## 10. START COMMANDS FOR THE HUMAN

**In Kilo PLAN mode, send:**

> Read `RAQEEB_EXTERNAL_STAGE_MASTER_PROMPT.md` completely. Execute **Section 2 (PLAN)** only. Inspect the repository, build an exact file-safe implementation plan, and stop before modifying anything. Make the first BUILD phase server startup and build/error stabilization.

**Then switch to Kilo BUILD mode (Tab to cycle agents, if shown in your UI) and send:**

> The plan is approved. Read `RAQEEB_EXTERNAL_STAGE_MASTER_PROMPT.md` and execute **Sections 3–9 in order**. First start the existing local server, verify and report the localhost link, and resolve in-scope build/runtime errors. Only after this checkpoint proceed with the full external Academic Theater redesign. Keep Student/Instructor/Admin portals untouched. Do not claim a check passed unless you ran it.
