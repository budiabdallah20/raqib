# RAQEEB — THE ACADEMIC THEATRE
## OpenCode Master Design & Implementation Brief

> **Mission:** Transform the existing public-facing Landing and Authentication experiences of RAQEEB into a visually distinctive, premium "Academic Theatre". Preserve the current application, authentication, routes, database, roles, and all existing internal portals. Create a genuinely authored art direction rather than a generic template.

## 0. Non-negotiable scope

**In scope:** the existing Landing Page and the existing Authentication Page (login/registration within that page), plus only their directly used style tokens, components, assets, and supporting code when necessary.

**Out of scope:** Student portal, Doctor portal, Admin portal, dashboards, database schema, Supabase RLS, migrations, permissions, unrelated routes, backend business logic, whole-project rewrite, replacing the framework, or modifying existing auth behavior.

- **Do not scaffold a replacement project.** Audit and edit the current repository in place.
- Preserve existing filenames, folders, asset references, routes, dependencies, API integrations, locale keys, role logic and established conventions unless a narrowly justified change is required.
- Do not overwrite work in progress, force-push, reset git, or delete files. If the working tree is dirty, inventory changes before editing.
- Do not add fabricated metrics, services, dashboards, or claims to marketing copy. Clearly mark planned capabilities if shown.
- No public Admin sign-up. Student / academic staff onboarding must follow existing authorization and approval rules. Any role selection is just presentation unless authorized in the actual system.
- Never expose environment variables, keys, tokens, sensitive student records or secrets to the frontend, generated assets, screenshots or logs.
- Preserve successful login, validation, password reset, session persistence, error states, and redirect logic.
- Existing BUDI/project design skills: discover and use applicable installed/local skills if they really exist; do not invent dependencies, tools or skills.

## 1. Creative north star

**Visual positioning:** "The Academic Theatre — Where Knowledge Takes the Stage."

The user should experience a modern digital opera house: velvet burgundy curtains, thin gilded proscenium arches, architectural depth, stage spotlights, tailored editorial typography, warm ivory copy, and contemporary glass/metal UI surfaces. The experience must still feel like a credible academic product, not a game or a movie poster.

### Intended emotional arc
1. **Grand Entrance** — anticipation, confidence and clarity.
2. **Knowledge Gallery** — discover real academic benefits through theatrical exhibits.
3. **Role Entrances** — Student, Doctor/Teaching Staff, Administration as architectural doorways or framed programs; respect actual authorization.
4. **Backstage Pass** — refined, calm, functional authentication.

### Color proposal (change only with an articulated design rationale)

| Token | Value | Function |
|---|---|---|
| `--stage-night` | `#160E19` | Main stage depth |
| `--velvet-burgundy` | `#75283F` | Curtain fabric and thematic accents |
| `--champagne-gold` | `#D4AC6E` | Architecture outlines, fine details, key CTA accent |
| `--warm-ivory` | `#FFF1D6` | Display headlines |
| `--dusty-rose` | `#B16A80` | Secondary accents |

Derive accessible surface shades, light hover states, error/success colors, and form text. Test real contrast; color alone must never carry meaning. Avoid all-gold interfaces, excessive glow, or unreadable text over imagery.

### Typography
- Arabic first-class (RTL layout and correct glyph shaping), English compatible.
- Discover existing fonts before changing anything. Prefer an excellent readable Arabic font and a restrained editorial English companion if needed; avoid loading unnecessary font families.
- Clear hierarchy: cinematic large heading, legible display subheading, accessible long-form body, substantial form labels.

## 2. Page-by-page art direction

### Landing: Act 01 — Hero / Grand Entrance
- A subtle architectural proscenium frame around the hero—not an ordinary rectangle.
- Two elegant curtains at the **sides**, with simulated fabric depth from optimized images/SVG/gradients. They should frame, not cover, the message.
- Ambient top spotlight and soft vignette; avoid excessive particle effects or many animated layers.
- Strong Arabic headline (copy can be refined): **"هنا يبدأ مستقبل تعليمك"**.
- Useful subheadline about academic organization without claims unsupported by the codebase.
- One primary CTA **"ابدأ رحلتك"** leading to the existing actual Auth route, and one secondary CTA **"اكتشف المنصة"** scrolling to the feature gallery.
- Clean professional navigation: brand, section links, language/theme controls only if already supported, prominent login button.
- Optional short first-visit stage reveal (< 800 ms) only when it does not delay access to content. Never require the animation before users can interact.

### Landing: Act 02 — Knowledge Gallery
- Display only actual existing benefits (candidate features to verify: lectures, tasks, QR attendance, progress tracking).
- Use theatre-inspired portraits, lit frames, cabinet niches, fine metal trims and material depth.
- Distinct hierarchy across cards; avoid repeating one generic glass card everywhere.
- Hover = slight elevation + changing lighting direction, never layout jumps or mouse-tracking overkill.
- Section transitions should be conceptually theatrical (e.g., program card, archway, stage lighting) without scroll hijacking.

### Landing: Act 03 — Role Entrances
- Create three elegant archetypal entry cards: Student, Teaching Staff, Administration.
- Explain each role concisely. Show buttons only for routes/actions which exist and user is allowed to access.
- **Do not** implement an admin registration option.
- On mobile, cards become a readable vertical sequence without ornate clipping.

### Landing: Final Curtain / Footer
- Architectural footer consistent with hero, but less complex.
- Present real project details only; functional links; no invented affiliations or badges.
- Final CTA to the existing registration route, not a dummy button.

### Authentication: The Backstage Pass
- Visually related to the landing page: same tokens, proscenium cues, warm lighting and typography.
- The form is the focus; treat it as a premium admission counter / framed pass, **not a tiny faux ticket**.
- Clearly separate login, registration, recovery, loading, success and error states that already exist.
- Keep all labels permanently legible, obvious password visibility control, proper input types, keyboard navigation and focus rings.
- Preserve actual validation, auth provider, session and redirects; no fake frontend login.
- Desktop may use a restrained split-screen (decorative stage scene + compact form). Mobile should prioritize the form and collapse decoration.
- Do not render blocked interactions while decoration loads. Stage animations must not interfere with keyboard or assistive technology.

## 3. Interaction and motion system

**Motion philosophy:** choreographed, purposeful, high-performance.

Recommended classes:
- **Ambient:** slow, nearly imperceptible lighting gradient.
- **Entrance:** brief curtain separation / spotlight fade, only for first visit when suitable.
- **Feedback:** CTA hover, focus, card illumination, form validation transitions.
- **Navigation:** short transitions that never obscure destination content.

Engineering constraints:
- Prefer CSS transforms and opacity; avoid animating `width`, `height`, or layout properties for frequent interactions.
- Support `prefers-reduced-motion: reduce`, no motion-dependent understanding.
- Do not add Three.js, heavy canvases, particles, scroll-jacking or large animation packages just for decoration.
- No autoplay audio. No fake preloaders. No full-screen overlays persisting after load.

## 4. Required operating workflow for OpenCode

### Phase 0 — Project reconnaissance (PLAN MODE, NO SOURCE EDITS)
1. Read root `AGENTS.md`, any scoped instructions, project skill files (if present), README, package manifest, route tree, existing landing/auth components, design tokens, asset folders, i18n, and relevant tests.
2. Run harmless inspection commands where permission allows: `git status`, dependency inventory and search for landing/auth routes.
3. Identify exact Landing/Auth files and the shared dependencies they use. Map the real auth flow, roles, locales, responsive behavior and redirects.
4. Screenshot or inspect current UI if a working preview/browser is available. Do not claim visual validation otherwise.
5. Produce a **baseline diagnosis**: what works, design debt, bugs, weak assets, performance risks and regression hazards.
6. Propose **three distinct professional art-direction variants** with concise rationale. Score each on originality, clarity, brand coherence, accessibility, responsiveness and implementation cost. Select one recommended solution. The default preferred direction is **Modern Royal Stage** (burgundy + gold + warm ivory).
7. Provide a component map, user journey, rough desktop/mobile wireframes, tokens and an ordered change plan.
8. **Stop before source edits** and present the plan; begin implementation only after the user authorizes the selected concept.

**Gate 0 output:** audit, file scope, concepts, selected direction, risks, acceptance plan. No modifications to application source.

### Phase 1 — Foundation and tokens (BUILD MODE)
1. Preserve the current repo and verify baseline commands. Never assume the package manager.
2. Implement scoped design tokens / typography / layering / z-index conventions and only required optimized decorative assets.
3. Create reusable pieces only when warranted: `StageFrame`, `CurtainEdge`, `SpotlightAccent`, `TheatreSectionHeading`, `RoleEntranceCard` etc.; adapt their names and locations to current architecture.
4. Scope decorative styling carefully to Landing/Auth; ensure student, doctor and admin portals remain visually/functionally unchanged.
5. Verify before proceeding; report specific files and tests.

**Gate 1 output:** functional foundation, responsive shell, tokens, safe diff, verified build status.

### Phase 2 — Landing Page execution
1. Implement Hero and nav, then Knowledge Gallery, then Role Entrances, then final CTA/footer.
2. Work section by section. Keep existing data and translations functional.
3. Check actual link destinations, image optimization, Arabic RTL, mobile/tablet/desktop after each section.
4. Test layouts at widths approximately 360, 390, 768, 1024, 1440 px (and zoomed text).
5. Keep design rich but readable; clean fallback when motion/assets unavailable.

**Gate 2 output:** landing page visually coherent and completely functional.

### Phase 3 — Authentication Page execution
1. Preserve the real auth integration end to end.
2. Implement shared visual identity without extending design beyond auth-owned components.
3. Verify login, registration, validation, errors, loading, password recovery (if present), authorized role handling, redirect, session and refresh behavior.
4. Test normal, invalid, slow-connection and keyboard-only flows. For sensitive flows, use nonproduction test data only.

**Gate 3 output:** polished auth page with existing functional behavior intact.

### Phase 4 — QA, performance and delivery
1. Run existing type-check, lint, build and tests; do not claim any command ran if it did not.
2. Run UI/browser checks with screenshots where available; include both RTL/LTR if supported.
3. Test light/slow devices, responsive breakpoints, low-end mobile, long translations, focus visibility and reduced motion.
4. Audit console errors, dead links, image load failures, Cumulative Layout Shift, excessive animations, and unauthorized routes.
5. Keep changes minimal and justified; inspect `git diff`; include **no unrelated modifications**.
6. Summarize changed files, intended behavior, measured results, remaining limitations and screenshots/links to locally generated previews if actually available.

**Gate 4 output:** working scoped frontend, verified tests, clear handoff and no regressions to internal portals.

## 5. Performance, accessibility, and security acceptance criteria

- Targets in real-user Core Web Vitals: **LCP <= 2.5s**, **INP <= 200ms**, **CLS <= 0.1** at p75; measure rather than promise. These are goals, not guarantees.
- Mobile first, keyboard accessible, semantic headings, visible focus, labels associated with fields, screen-reader-compatible error messages, appropriately sized click targets.
- Respect existing RTL/LTR localization architecture and fallback strings. Text must not overflow on zoom or translation.
- Images below the fold should be appropriately lazy-loaded; hero visuals optimized and available without blocking text.
- Decorative elements must not trap focus, intercept form clicks or cause visual instability.
- Keep secrets server-side and preserve existing session/role checks and RLS behavior.
- No unnecessary new dependency; if one is essential, justify its bundle and maintenance cost before installing.

## 6. Explicit forbidden shortcuts

- No redesign of any internal portal.
- No full project rearchitecture or new starter scaffold.
- No generic dark gradient + stock photo in place of genuine theatrical composition.
- No giant logo animation, fake counters, fake official endorsements, fake features or inaccessible demo buttons.
- No autoplay audio, multi-second loading ceremony, 3D performance traps, harsh neon, excessive confetti/particles.
- No public Admin signup, role escalation, bypass of auth checks or fake session state.
- No deleting existing content, IDs, routes or translations without mapping dependencies.
- No unlicensed third-party assets copied from design references.

## 7. Work product / acceptance report

For each phase, give a short, high-value report:

1. **What changed:** exact files and component names.
2. **Why:** visual / UX rationale.
3. **What was preserved:** routes, auth, roles, i18n, internal portals.
4. **Verification:** exact commands and results; screenshots only if genuinely produced.
5. **Risks and follow-ups:** specific, not generic.

The final UI should feel carefully art-directed enough to stand out in a professional portfolio while remaining usable by university students and faculty on everyday phones.

---

## Copy/paste launch prompt for OpenCode PLAN mode

```text
We are modifying the EXISTING RAQEEB project, not generating a new app.
Read RAQEEB_THEATRE_MASTER_BRIEF.md entirely and follow its phased plan.
IMPORTANT: Start in PLAN mode. For this first pass do not edit application source files.
Inspect root/nearby AGENTS.md, project skills if present, actual landing/auth routes,
styles, assets, translations, and the current Supabase auth and role flow.
Produce: (1) baseline audit; (2) three visually differentiated design concepts
with an evaluation and your recommended Modern Royal Stage direction;
(3) precise desktop and mobile screen-by-screen art direction;
(4) exact files in-scope and out-of-scope; (5) architecture of design tokens and
components; (6) phase gates, checks, and regression risks.
Be boldly original in typography, curtains, architectural frames and lighting,
but prioritize clarity, performance, RTL accessibility, and functional auth.
Do not touch student/doctor/admin internal portals. Await my go-ahead before
implementation. Do not give me boilerplate UI or empty marketing claims.
```

## Copy/paste execution prompt for OpenCode BUILD mode (after approved PLAN)

```text
Implement the approved plan in RAQEEB_THEATRE_MASTER_BRIEF.md in the CURRENT repository.
Proceed Gate 1 -> Gate 2 -> Gate 3 -> Gate 4, with verification between phases.
Keep edits strictly scoped to Landing/Auth and necessary shared primitives.
Preserve real authentication, role authorization, Supabase integration, redirects,
translation architecture and all internal dashboards. No mock auth, no public admin signup.
Create cohesive theatre art direction: velvet curtains, subtle proscenium frame,
controlled spotlights, warm gold details, elegant typography and meaningful CTAs.
No heavy 3D or blocking preloaders. Prioritize responsive performance and reduced motion.
After each gate, report exact changed files, checks run and remaining issues.
Fix regressions within this scope before final handoff. Never fabricate test results.
```
