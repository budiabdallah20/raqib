# RAQEEB — FULL BUILD REPAIR & LANDING PAGE VISUAL REDESIGN

## ROLE & EXECUTION MODE

You are Kilo Code, acting as a **Senior Full-Stack Engineer, Build Systems Specialist, UI/UX Art Director, and Frontend Design Engineer**.

Your responsibility is to inspect, repair, clean, redesign, implement, and validate the existing RAQEEB project.

**This is an implementation assignment, not a planning or advisory task.**

Do not stop after identifying problems. Make the necessary code changes, run validation, correct failures, and provide a final report.

You must complete the following two missions in strict sequence:

1. Complete build repair, project-specific cache cleanup, and development server stabilization.
2. Complete landing page visual redesign and loading screen enhancement.

Do not start Mission 2 until Mission 1 passes its validation requirements.

---

# MISSION 0 — PROJECT DISCOVERY

Before modifying anything:

1. Identify the current workspace root.
2. Locate the RAQEEB project directory.
3. Inspect the repository structure recursively, excluding generated, dependency, and sensitive directories.
4. Detect the actual framework and package manager.
5. Read `package.json`, relevant configuration files, and application entry points.
6. Identify the current landing page, loading screen, footer, technology section, shared components, CSS files, and design tokens.
7. Check Git status and preserve all existing uncommitted user changes.
8. Identify which commands currently start, build, lint, and type-check the project.

Do not assume the project uses a particular framework until you verify it.

If the RAQEEB project is not inside the current workspace, locate it within accessible workspace directories. Do not scan the entire computer or unrelated private directories.

**MANDATORY:** Work directly in the existing project. Never create an unrelated replacement project.

---

# MISSION 1 — COMPLETE BUILD REPAIR & SAFE CACHE CLEANUP

## Objective

Eliminate reproducible build errors, resolve development-server problems, remove stale project-generated caches, and restore stable development behavior.

## 1.1 Comprehensive build diagnosis

Inspect and fix:

- Compilation and bundler errors.
- TypeScript type errors.
- Missing imports and unresolved modules.
- Broken module paths and aliases.
- Invalid exports and imports.
- Missing dependencies.
- Package version incompatibilities.
- Invalid frontend configurations.
- Server/client component boundary problems.
- React rendering and hydration mismatches.
- Broken dynamic imports.
- Invalid CSS imports.
- PostCSS and Tailwind configuration errors.
- Actual runtime exceptions.
- Development-server startup failures.
- Stale generated artifacts.
- Relevant dependency and package-manager warnings.

Run the project's supported validation commands.

Where scripts exist, run the actual equivalents of:

```bash
npm run lint
npm run typecheck
npm run build
```

Adapt commands to the detected package manager and scripts. Do not assume missing scripts are available.

Fix the underlying causes rather than suppressing errors.

Never disable TypeScript checks, ESLint rules, or framework build validation simply to obtain a passing result.

## 1.2 Safe project cache cleanup

Identify and remove only disposable, generated caches belonging to this project, as applicable:

```text
.next/cache
node_modules/.cache
.turbo
.vite
dist
build
```

Other framework-generated output directories may be cleaned only after verifying that they contain no source files or user data.

Important safety rules:

- Do not delete project source code.
- Do not delete `.env` files.
- Do not delete databases, storage, uploads, or migrations.
- Do not delete Git history.
- Do not clear system-wide caches.
- Do not reset the operating system.
- Do not clear browser data.
- Do not delete unrelated projects.
- Do not remove dependency lockfiles.
- Do not delete `node_modules` unless a verified dependency problem makes a clean reinstall necessary.
- Do not terminate unrelated processes.

If a project development server is running, identify its process before stopping it. Stop only project-owned processes when necessary.

Do not describe a cache cleanup as a permanent fix for a problem that requires a code or dependency correction.

## 1.3 Dependency and configuration repair

Verify:

- Node.js version compatibility.
- Package manager consistency.
- Dependency resolution.
- Valid lockfile usage.
- Next.js or other detected framework configuration.
- Tailwind and PostCSS integration.
- TypeScript compiler configuration.
- Environment variable references.
- Import aliases.
- Development-server host and port configuration.

Avoid unnecessary major-version upgrades.

If dependency changes are necessary, make minimal compatible adjustments and document them.

## 1.4 Server stabilization

Start the development server using the existing project scripts.

Verify:

1. Server startup completes without errors.
2. The landing page responds successfully.
3. Frontend assets load correctly.
4. Navigation works.
5. Authentication pages remain functional.
6. No critical runtime errors occur.
7. Hot Module Replacement works where supported.
8. CSS changes appear without requiring manual cache deletion.
9. No repeated server crashes occur.
10. The production build succeeds.

If browser automation is available, verify the pages visually and inspect browser console errors.

Do not claim success based only on a successful server startup.

## MISSION 1 EXIT GATE

Mission 1 is complete only when:

- Build failures have been resolved.
- Type-checking passes where configured.
- The development server runs correctly.
- Disposable project caches have been cleaned.
- The main pages remain accessible.
- No critical errors remain.

If an external blocker prevents completion, explain the blocker accurately and avoid declaring success.

---

# MISSION 2 — LANDING PAGE COMPLETE VISUAL REDESIGN

## Primary objective

Transform the existing RAQEEB landing page into a distinctive, premium, visually cohesive academic platform.

The new visual identity must combine:

**BURGUNDY + ORANGE + WHITE + BLACK**

The final result must feel:

- Premium.
- Academic.
- Cinematic.
- Professional.
- Modern.
- Visually balanced.
- Accessible.
- Consistent.
- Responsive.

Preserve the existing academic theater identity wherever it improves the visual experience.

The redesign must be substantial, not a minor color adjustment.

## 2.1 Mandatory design reference

Study the following live portfolio website:

**https://budi-portfolio-dev.vercel.app/**

This is the primary visual reference for:

- Framed section layouts.
- Card architecture.
- Skill and technology presentation.
- Decorative borders.
- Badge styling.
- Premium visual hierarchy.
- Depth and shadows.
- Hover interaction patterns.
- Section headers.
- Visual spacing.
- Glass-like cards.
- Sophisticated micro-interactions.

Inspect the reference website directly using available browser tools.

Pay particular attention to how its skills and technology items are presented within decorative frames.

Extract applicable design principles and adapt them to RAQEEB.

Do not blindly copy unrelated content, text, logos, or functionality.

If the live website cannot be inspected, explicitly report that limitation and implement the requested framed design using the specifications below rather than claiming to have reviewed it.

---

# 2.2 GLOBAL COLOR SYSTEM

Replace the current landing-page color identity with the following coordinated palette.

| Token | Color | Purpose |
|---|---|---|
| Primary Burgundy | `#651D32` | Brand surfaces, borders, accent areas |
| Deep Burgundy | `#3A1020` | Premium dark backgrounds |
| Warm Orange | `#F28C28` | CTAs, highlights, interaction accents |
| Soft Orange | `#FFB45C` | Glows and subtle highlights |
| Pure White | `#FFFFFF` | Text on dark backgrounds |
| Warm Ivory | `#FFF8F0` | Light surfaces |
| Near Black | `#111014` | Premium dark backgrounds |
| Charcoal | `#211B20` | Secondary dark surfaces |

Use CSS custom properties or the existing design-token system to define semantic colors.

Do not scatter hardcoded colors throughout unrelated components.

### Color composition

Use burgundy and near-black as the foundation.

Orange should function as a deliberate visual highlight, not overwhelm the page.

White and ivory should provide contrast, readability, and breathing room.

Use gradients selectively.

Avoid excessive glow, saturation, and decorative noise.

All text and interactive elements must maintain accessible contrast.

---

# 2.3 COMPLETE LANDING PAGE REDESIGN

Inspect all sections of the existing landing page.

Redesign every visible section while preserving its content, features, and logical structure.

The redesign must include, where present:

- Header and navigation.
- Hero section.
- Call-to-action buttons.
- Statistics and counters.
- Features and benefits.
- Services.
- Academic platform information.
- Decorative backgrounds.
- Section headings.
- Cards and panels.
- Technology showcase.
- Footer.
- Responsive mobile navigation.

Apply a consistent visual language throughout the entire landing page.

Do not redesign only the hero and leave the remaining sections with the old styling.

---

# 2.4 NEW CARD ARCHITECTURE

Replace the existing landing-page card styling with a premium, original card system.

Every card must have:

1. A consistent border language.
2. Carefully selected background materials.
3. Controlled shadow depth.
4. Harmonized border radii.
5. Precise internal spacing.
6. Clear typographic hierarchy.
7. Consistent icon positioning.
8. Subtle hover animations.
9. Responsive dimensions.
10. Keyboard-accessible interactive states.

### Recommended card materials

Use a combination of:

- Deep burgundy glass surfaces.
- Charcoal panels.
- Thin orange accent borders.
- Subtle inner highlights.
- Layered shadows.
- Delicate orange atmospheric glows.

Cards should appear sophisticated and structured, never excessively transparent or cluttered.

### Hover interaction

Implement subtle hover behaviors such as:

- Small upward translation.
- Controlled shadow enhancement.
- Orange border illumination.
- Gentle icon movement.
- Background gradient transitions.

Avoid excessive scaling or distracting continuous animation.

Respect `prefers-reduced-motion`.

---

# 2.5 TECHNOLOGY SECTION — HIGHEST VISUAL PRIORITY

**This section is located immediately before the footer.**

It must receive a complete structural and visual redesign.

Use the BUDI Portfolio skills section as the key design inspiration.

## Required visual concept

Create a premium framed technology showcase resembling a museum display or academic exhibition.

The section must include:

- One elegant large outer decorative frame.
- A clearly defined section title.
- Burgundy structural borders.
- Warm orange highlights.
- Carefully designed inner compartments.
- Individual framed technology cards.
- Official technology logos where available.
- Clean technology names.
- Balanced spacing and alignment.
- Consistent hover behavior.
- Responsive card placement.

### Individual technology cards

Each technology must sit within its own decorative mini-frame.

Do not use generic plain rectangular badges as the primary visual system.

Use:

- Decorative corner accents.
- Thin layered borders.
- A subtle inset surface.
- Carefully centered logo.
- Clear typography.
- Premium shadows.
- Controlled orange hover highlights.

The technologies should feel like valuable objects presented in a curated exhibition.

### Design reference

The framing, presentation, and visual hierarchy should be influenced by:

https://budi-portfolio-dev.vercel.app/

Adapt the style to the RAQEEB burgundy/orange identity.

Preserve all existing technologies and their data sources.

Do not invent technologies or replace official branding with fabricated logos.

---

# 2.6 BADGES & BUTTONS REDESIGN

Redesign all landing-page badges and buttons.

### Badges

Create consistent badge variants:

- Primary burgundy badge.
- Orange highlight badge.
- Neutral charcoal badge.
- Light ivory badge.

Add refined borders, spacing, and icon alignment.

### Buttons

Implement consistent variants:

- Primary orange CTA.
- Secondary burgundy CTA.
- Outlined dark button.
- Subtle text-action button.

All variants must support:

- Hover.
- Focus-visible.
- Disabled.
- Loading, where relevant.
- Keyboard navigation.
- Responsive sizing.

Avoid inconsistent button shapes or unrelated styling patterns.

---

# 2.7 LOADING SCREEN — PREMIUM CINEMATIC IMPROVEMENT

Redesign the RAQEEB loading screen to match the new landing-page identity.

## Visual direction

Create an elegant academic-theater opening experience.

Use:

- Deep burgundy background.
- Cinematic darkness.
- Soft orange light accents.
- Refined RAQEEB branding.
- Subtle theater-inspired decorative elements.
- Smooth entrance and exit transitions.
- Professional typography.

### Suggested sequence

1. Dark burgundy cinematic background appears.
2. Soft warm orange light subtly reveals the brand.
3. RAQEEB logo or brand name enters gracefully.
4. A refined academic-themed detail appears.
5. The interface transitions smoothly into the landing page.

The animation should feel cinematic, not slow or overly theatrical.

### Mandatory functional rules

- Do not block the user longer than necessary.
- Do not introduce artificial loading delays.
- Avoid flicker and layout shifts.
- Prevent hydration mismatches.
- Respect reduced-motion accessibility preferences.
- Ensure the loading screen works on mobile.
- Ensure it never becomes stuck indefinitely.
- Preserve the application's actual loading lifecycle.

Loading transitions must not interfere with authentication or navigation.

---

# 2.8 RESPONSIVENESS & PERFORMANCE

Validate the redesigned page on:

- 320px mobile screens.
- 375px mobile screens.
- 768px tablets.
- 1024px laptops.
- 1440px desktop displays.
- Larger desktop displays.

Ensure:

- No horizontal overflow.
- No overlapping cards.
- No clipped content.
- No unreadable text.
- No broken navigation.
- No excessive motion.
- No layout shifts caused by images.
- No unnecessary JavaScript animation.
- Good performance on lower-powered devices.

Prefer CSS-based transitions where appropriate.

Do not introduce heavy 3D frameworks or unnecessarily large dependencies.

---

# 2.9 SCOPE PROTECTION

This assignment targets:

1. Build infrastructure and project reliability.
2. The public landing page.
3. The existing loading screen.
4. Shared design primitives used by those screens.

Do not redesign the internal Student, Doctor, or Admin portals.

Do not modify Supabase database schemas.

Do not change authentication behavior.

Do not remove existing routes.

Do not change business logic.

Do not remove existing landing-page content.

Do not break internationalization.

Do not replace the application's architecture without a verified technical necessity.

Any shared component changes must preserve compatibility with existing consumers.

---

# MISSION 3 — FINAL VALIDATION

After completing both primary missions:

1. Run the project build again.
2. Run lint checks where configured.
3. Run TypeScript validation where configured.
4. Start the development server.
5. Verify the redesigned landing page.
6. Verify the loading screen.
7. Verify technology frames and badges.
8. Verify mobile responsiveness.
9. Inspect browser console errors if browser tooling exists.
10. Confirm authentication routes remain intact.
11. Verify no significant regressions were introduced.
12. Check the final Git diff for accidental unrelated modifications.

Fix any failures introduced by the redesign.

## Final reporting format

Provide a concise, evidence-based implementation report:

### Mission 1 — Build & Server

- Problems discovered.
- Root causes.
- Files modified.
- Caches safely cleaned.
- Build result.
- Type-check and lint results.
- Development-server verification.

### Mission 2 — Visual Redesign

- Sections redesigned.
- New color system.
- Card and badge components modified.
- Technology showcase improvements.
- Loading screen changes.
- Responsive improvements.

### Final Status

- Build: PASS / FAIL / BLOCKED
- TypeScript: PASS / FAIL / NOT CONFIGURED
- Lint: PASS / FAIL / NOT CONFIGURED
- Dev server: PASS / FAIL / BLOCKED
- Landing page: VERIFIED / NOT VERIFIED
- Authentication regression check: PASS / FAIL / NOT VERIFIED

Do not mark a test as PASS unless it was actually executed successfully.

---

# NON-NEGOTIABLE EXECUTION RULES

1. **Inspect first, modify second.**
2. Complete Mission 1 before Mission 2.
3. Implement changes directly in the RAQEEB workspace.
4. Preserve the existing project architecture.
5. Never delete source files as a cache-cleanup shortcut.
6. Preserve data, authentication, and backend functionality.
7. Use the BUDI Portfolio URL as the primary visual reference.
8. Redesign the entire public landing page, not only isolated components.
9. Give the technology section a distinctive framed presentation.
10. Use the new burgundy, orange, white, and black visual identity consistently.
11. Make the loading screen cinematic but performant.
12. Execute validation commands and fix verified errors.
13. Do not claim completion without evidence.
14. Never conceal build failures or suppress errors to pass tests.
15. Deliver a completed implementation with a final report.

**START NOW: Identify the RAQEEB project root, inspect the repository, execute Mission 1, verify its results, then implement Mission 2 and complete the final validation.**     خلي خليفه المسرح دي في اطار الموقع بكامل مش قسم الهيرو فقط خليفه خليفه لصفحه هبوط بكامل وكراسي استخدم موقع دا https://unsplash.com/ , و     خد خليفات منه وحطها يكبير 