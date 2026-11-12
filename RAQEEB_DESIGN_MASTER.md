# RAQEEB — PHASE ONE RADICAL EXTERNAL REBUILD
## Academic Theatre Identity — Full Visual & UX Transformation

> **Mission**
>
> Transform the entire **external experience** of the RAQEEB platform into a highly polished, premium, immersive **Academic Theatre** digital experience.
>
> This is **not** a minor redesign.
>
> This is a **radical but controlled visual rebuild** of the public-facing phase of the platform:
>
> 1. Loading Screen  
> 2. Landing Page  
> 3. Authentication / Login / Register Experience
>
> The final result must feel like:
>
> - a theatrical academic institution
> - elegant, cinematic, premium
> - dark luxury + red velvet theatre aesthetic
> - warm golden lighting
> - architectural frames and stage composition
> - polished UX with strong readability and usability
>
> The site must feel like a user is entering a **grand academic theatre**, not a generic web app.

---

# 0) MANDATORY OPERATING MODE

You are **not allowed** to behave like a passive assistant that only gives suggestions.

You must behave as a:

- Principal Product Designer
- Creative Director
- Senior Frontend Engineer
- Design Systems Architect
- Motion Designer
- UX Reviewer
- QA Reviewer
- Self-Correcting Implementation Agent

You must actively:

1. inspect the project
2. understand the existing codebase
3. identify the current styling architecture
4. identify weak or inconsistent UI patterns
5. produce a plan
6. implement changes directly
7. review your own work
8. run checks
9. fix your own mistakes
10. refine the result

Do **not** stop at planning only.

Unless there is a serious blocker, you must proceed to implementation.

If you find a better solution than the one implied by my request, explain it briefly and then implement the stronger solution.

---

# 1) MANDATORY SKILLS TO USE

You must use the installed **Budi / Architect Mind skills** as part of your execution model.

Mandatory skills to activate conceptually during this task:

- `architect-orchestrator`
- `repo-cartographer`
- `solution-architect`
- `execution-planner`
- `design-director`
- `implementation-engineer`
- `debug-detective`
- `code-review-critic`
- `test-strategist`
- `performance-investigator`
- `change-safety-keeper`
- `collaboration-partner`

If these skills exist as project skills, use them.
If the tool supports skill loading, load and apply them.
If explicit loading is not available, still follow their roles and workflow strictly.

These skills are **mandatory**.

---

# 2) STRICT SCOPE

## Work ONLY on PHASE ONE (external/public experience)

### Included:
- Loading screen
- Landing page
- Login page
- Register page
- Authentication UI shell
- External shared layout
- Public navigation
- External buttons, cards, sections, icons, decorations, backgrounds
- Global design tokens used by the external experience

### Excluded for now:
- Student portal
- Doctor portal
- Admin portal
- Internal dashboards
- Role-based internal business logic
- Database structure
- Auth provider logic
- Permission policies
- Backend business rules

You may create **shared design foundations** for future reuse, but do not redesign internal portal pages now.

---

# 3) NON-DESTRUCTIVE ENGINEERING RULES

Before changing UI deeply:

1. Inspect the entire repository.
2. Detect the framework and architecture actually used.
3. Detect routing structure.
4. Detect styling system:
   - Tailwind
   - CSS Modules
   - global CSS
   - SCSS
   - styled-components
   - shadcn/ui
   - any token system
5. Detect reusable components.
6. Detect auth flow.
7. Detect visual bugs and technical debt.

## Critical rules:
- Do **not** rebuild from scratch blindly.
- Do **not** delete working functionality.
- Do **not** break login/register/auth flow.
- Do **not** expose environment variables.
- Do **not** modify unrelated internal business logic.
- Do **not** install libraries unnecessarily.
- Do **not** leave dead code behind if you replace something.
- Do **not** fake completion.

If old styling is messy, you are allowed to **refactor the styling architecture** for the external phase, but safely.

---

# 4) CREATIVE DIRECTION — ACADEMIC THEATRE

## Core identity:
The website should feel like entering a **prestigious academic theatre**.

The visual language must combine:

- classical theatre architecture
- luxury stage atmosphere
- red velvet curtains
- elegant auditorium seating inspiration
- warm cinematic gold lighting
- stage doors / gates / arches
- ornamental frames
- glassmorphism for premium cards
- sophisticated shadows and glow
- refined academic credibility

## Emotional tone:
- grand
- elegant
- immersive
- intelligent
- disciplined
- premium
- artistic but usable

---

# 5) VISUAL LANGUAGE REQUIREMENTS

## A. Backgrounds
Backgrounds should feel theatrical and immersive.

Use combinations of:
- dark cinematic backdrops
- theatre curtains
- stage architecture
- warm spotlight overlays
- ornamental layers
- subtle depth gradients
- elegant blurred light bloom
- architectural framing

Possible motifs:
- red velvet curtains
- theatre arch
- stage proscenium
- glowing chandeliers / warm ambient light
- classical golden frame edges
- subtle rows of theatre seats as visual inspiration
- stage floor texture
- prestige academic hall atmosphere

Backgrounds must support readability and never overpower content.

---

## B. Cards
Cards must be redesigned completely.

Target direction:
- glassy surfaces
- soft transparency
- premium borders
- elegant shadows
- subtle internal highlights
- architectural or theatre-inspired framing
- optional shape inspiration from theatre seating geometry

Cards must not be generic rectangles only.

Create visually distinct card variants, such as:
- feature cards
- user role cards
- CTA cards
- information cards
- authentication panels

Cards should feel like premium theatre panels or elegant seating plaques.

---

## C. Buttons
All buttons must be redesigned.

Target style:
- premium theatre action buttons
- subtle gold outlines or glow
- hover illumination
- elevated depth
- confident typography
- tactile press feedback
- elegant rounded geometry
- coherent with the stage theme

Required button variants:
- primary
- secondary
- outline
- ghost
- danger if needed
- icon button
- CTA hero button

Each button must feel designed, not default.

---

## D. Icons
All icons in the external phase must fit the new identity.

Rules:
- unify icon style
- use clean modern iconography
- align icon sizes and strokes
- wrap key icons in elegant theatre-themed icon containers when appropriate
- icons may have subtle glow or framed housing
- avoid random mixed icon styles

---

## E. Frames and Ornamentation
Frames are essential to the identity.

Use:
- elegant border systems
- ornamental corner details
- theatrical dividers
- proscenium-like containers
- gate/door inspired section framing
- premium separators
- heading underlines with golden detail

These must be tasteful and not cluttered.

---

## F. Typography
Typography must feel premium and readable.

Need:
- clear hierarchy
- elegant headings
- refined body text
- Arabic support
- English support if present
- readable spacing
- strong CTA typography

Headings should feel cinematic and prestigious, but body text must remain practical.

---

# 6) DESIGN TOKEN SYSTEM (MANDATORY)

You must create or refactor a proper token system for the external phase.

## Required token groups:
- colors
- text colors
- surface colors
- border colors
- glow colors
- lighting overlays
- spacing scale
- radius scale
- shadow scale
- motion durations
- easing curves
- z-index layers
- typography scale
- breakpoints

## Suggested semantic direction:
- `--bg-stage`
- `--bg-curtain`
- `--bg-panel`
- `--surface-glass`
- `--surface-elevated`
- `--accent-gold`
- `--accent-burgundy`
- `--accent-ivory`
- `--text-primary`
- `--text-muted`
- `--border-ornament`
- `--shadow-stage`
- `--glow-spotlight`
- `--motion-fast`
- `--motion-medium`
- `--motion-cinematic`

Do not scatter arbitrary values across files.

Centralize the system.

---

# 7) PAGE-BY-PAGE REQUIREMENTS

## 7.1 LOADING SCREEN — GRAND ENTRANCE

The loading experience must feel majestic and memorable.

### Desired concept:
A dramatic entrance into the academic theatre.

Possible sequence:
1. dark ambience
2. a subtle warm light appears
3. RAQEEB identity emerges
4. curtain / stage / gate motif appears
5. elegant transition into landing page

### Requirements:
- premium visual entrance
- short and respectful duration
- not annoying
- not fake or gimmicky
- reduced-motion support
- no useless long blocking animation
- must feel premium and “serious”

### Visual ideas:
- curtain reveal
- stage spotlight
- emblem / monogram reveal
- elegant glow
- fade through theatre gate
- soft cinematic audio is NOT required unless already supported

---

## 7.2 LANDING PAGE — ACADEMIC STAGE EXPERIENCE

The landing page must be rebuilt as a full public story.

### Required sections (adapt to project content):
1. Hero / Grand Stage Opening
2. About / Academic Mission
3. Platform Benefits / Features
4. User Roles Preview
5. Workflow / How It Works
6. Final CTA / Entrance to Login

### Hero requirements:
- bold visual impact
- strong headline
- premium subtitle
- refined CTA buttons
- background with theatre identity
- layered composition
- lighting and depth
- clear reading contrast

### Feature presentation:
Feature cards must look premium and original.
Do not use plain boring grids.

### User roles:
Student / Doctor / Admin previews should feel like entering dedicated theatre halls or framed portals.

### Final CTA:
Must feel like approaching the gate to enter the system.

---

## 7.3 AUTHENTICATION EXPERIENCE — THE GRAND GATE

The login/register pages must become an elegant theatre entrance.

### Desired feeling:
The user is standing at the formal entrance to the academic theatre.

### Visual motifs:
- gate / arch / door frame
- illuminated panel
- velvet or stage background
- framed auth card
- elegant inputs
- premium labels
- spotlight focus behavior

### Requirements:
- preserve existing auth logic
- preserve validation
- preserve error messages
- preserve redirects
- preserve accessibility
- preserve keyboard flow
- preserve mobile usability
- preserve input clarity

### Inputs:
Inputs must be redesigned to match the theatre identity:
- refined borders
- glow on focus
- clean placeholder hierarchy
- elegant icons if used
- high readability

---

# 8) COMPONENT REBUILD REQUIREMENTS

Redesign or create shared external components as needed.

Possible components:
- StageBackground
- TheatreCurtain
- TheatreLightOverlay
- StageGateFrame
- OrnamentalFrame
- TheatreButton
- TheatreCard
- RolePortalCard
- CinematicHeading
- GoldenDivider
- SpotlightGlow
- HeroPanel
- TheatreInput
- TheatreNavigation
- TheatreFooter
- LoadingEntrance
- CTASection
- FeatureGrid
- AuthShell

These are conceptual names. You may rename them based on project conventions.

All must be reusable and consistent.

---

# 9) ANIMATION AND INTERACTION SYSTEM

Motion must be refined and deliberate.

## Required qualities:
- cinematic but not heavy
- polished
- layered
- smooth
- fast enough for production
- GPU-friendly where possible
- reduced-motion alternatives

## Desired effects:
- curtain reveal
- spotlight fade
- soft section entrance
- subtle hover lift
- button glow on hover
- card reveal
- heading reveal
- parallax only if safe and lightweight
- auth panel entrance
- transition continuity between pages

## Avoid:
- chaotic animations
- excessive bounce
- long delays
- distracting loops
- performance-heavy effects
- animation for everything

---

# 10) UX / USABILITY PRIORITY

Theatre identity must never destroy usability.

You must improve:
- spacing
- hierarchy
- CTA clarity
- responsive behavior
- form readability
- mobile layout
- tablet layout
- visual rhythm
- hover feedback
- focus states
- section clarity
- content scannability

If a beautiful effect hurts UX, choose the stronger UX solution.

---

# 11) RESPONSIVE & RTL REQUIREMENTS

Must work well on:
- desktop
- laptop
- tablet
- mobile

Must support:
- Arabic RTL correctly
- alignment consistency
- no broken spacing in RTL
- no overflow
- no clipped text
- no overlapping cards
- no broken hero layout
- no broken auth layout

---

# 12) ASSET RESEARCH REQUIREMENTS

You may use professional visual inspiration and assets research for theatre aesthetics.

Research concepts like:
- theatre interiors
- red velvet curtains
- stage lights
- auditorium aesthetics
- ornate frames
- theatre gates
- opera house visual motifs
- luxury dark UI references

But:
- do not copy any specific design directly
- do not create copyright violations
- do not use low-quality filler images
- optimize chosen images/assets properly
- prefer efficient assets
- prefer CSS/SVG decorative solutions when appropriate

---

# 13) IMPLEMENTATION STRATEGY

Follow this order strictly:

## Phase A — Repository Audit
- inspect files
- understand stack
- identify existing structure
- identify issues
- identify public pages and styles

## Phase B — Design Direction Setup
- define art direction
- define tokens
- define shared visual language
- choose component strategy

## Phase C — Shared Design Foundations
- implement tokens
- implement reusable external components
- implement utility patterns
- refactor external global styles if needed

## Phase D — Loading Screen Rebuild
- implement premium loading experience
- test transitions
- ensure reduced-motion support

## Phase E — Landing Page Rebuild
- rebuild hero
- rebuild sections
- rebuild cards
- rebuild icons and actions
- rebuild spacing and composition
- ensure theatre identity is visible everywhere

## Phase F — Authentication Rebuild
- rebuild login/register shell
- restyle inputs/buttons/messages
- preserve logic
- ensure usability

## Phase G — QA / Self-Review / Correction
- inspect every changed page
- detect layout flaws
- detect inconsistencies
- run checks
- fix issues
- polish result

---

# 14) MANDATORY SELF-REVIEW LOOP

After every major implementation stage, do all of the following:

1. inspect the result critically
2. identify visual defects
3. identify spacing issues
4. identify inconsistency in shadows, borders, and radii
5. identify motion issues
6. identify accessibility issues
7. identify responsive issues
8. identify dead or duplicate code
9. improve weak parts
10. summarize what was fixed

You must not stop at “done” if obvious issues still exist.

---

# 15) REQUIRED COMMANDS / CHECKS

After implementation, run relevant checks available in the project, such as:

- install dependencies if needed
- lint
- type-check
- build
- relevant tests
- inspect console errors if app runs
- inspect visual output if preview is available

If any errors occur:
- diagnose them
- fix them
- rerun checks

Do not leave known broken code.

---

# 16) OUTPUT FORMAT DURING EXECUTION

Communicate progress like a serious engineering partner.

At minimum, provide:

1. **Audit Findings**
2. **Planned Approach**
3. **Files To Modify**
4. **Implementation Progress**
5. **Issues Found**
6. **Fixes Applied**
7. **Checks Run**
8. **Final Summary**
9. **Remaining Recommendations**

Do not give vague generic replies.

Be concrete.

---

# 17) AUTONOMOUS IMPROVEMENT PERMISSION

You have permission to make **in-scope creative and structural styling improvements** without asking for each tiny change, as long as you preserve functionality.

Examples of allowed proactive improvements:
- unify spacing
- normalize icon sizing
- improve card hierarchy
- improve CTA placement
- improve hover states
- improve focus states
- improve mobile layout
- refactor repeated styles
- create reusable components
- improve section rhythm
- improve animation polish
- improve code clarity
- remove obvious visual clutter

But do not:
- invent fake platform features
- change business logic
- modify roles/permissions
- delete working flows
- alter backend contracts without need

---

# 18) DEFINITION OF DONE

This task is done only when all of the following are true:

- the external phase looks radically upgraded
- the site has a clear academic theatre identity
- loading screen feels premium
- landing page feels immersive and polished
- login/register look like part of the same world
- buttons, cards, icons, frames, and sections all match one design system
- old inconsistent styling is removed or tamed
- no major responsive bugs remain
- no major auth UX problems remain
- checks pass or failures are clearly explained and fixed where possible
- the final result feels handcrafted, not template-like

---

# 19) FINAL DIRECTIVE

Do not be timid.

Do not give me a weak surface-level redesign.

Do not behave like a passive prompt responder.

Perform a **serious radical redesign** of the external RAQEEB experience into a premium **Academic Theatre** identity with:

- red curtains
- theatre lighting
- gates / doors / arches
- elegant frames
- luxury dark backgrounds
- glass cards
- theatre-inspired seating/card geometry
- premium typography
- cinematic transitions
- strong CTA hierarchy
- polished loading entrance

Use the installed Budi / Architect Mind skills.

Think deeply.
Plan smartly.
Implement boldly.
Review critically.
Fix your own mistakes.
Ship a premium result.
# RAQEEB — CINEMATIC THEATRE EXPERIENCE
## MASTER BRIEF ADDENDUM — PHASE 2
### Real Theatre Photography • Premium Glass UI • Cinematic Lighting • Complete Visual Refinement

**ROLE:** Act simultaneously as a World-Class Creative Director, Senior UI/UX Designer, Art Director, Frontend Architect, Performance Engineer, and QA Specialist.

**MISSION:** Transform the existing RAQEEB external experience into a premium, cinematic academic theatre. This is a comprehensive visual redesign, not a simple CSS adjustment.

**SCOPE:** Landing Page + Authentication Page ONLY.

**IMPORTANT:** This document extends `RAQEEB_THEATRE_MASTER_BRIEF.md`. All previous functional, architectural, security, and project-preservation rules remain mandatory. Where visual instructions conflict, this addendum takes priority.

---

# 01 — NON-NEGOTIABLE PROJECT RULES

1. Work exclusively inside the existing RAQEEB project.
2. Never rebuild the project from scratch.
3. Never replace the existing architecture unnecessarily.
4. Preserve existing routes, APIs, authentication, Supabase integrations, database connections, and business logic.
5. Do not modify Student, Doctor, or Admin dashboards.
6. Inspect existing components, styling, assets, and dependencies before making changes.
7. Reuse existing libraries whenever appropriate.
8. Avoid unnecessary packages, heavy 3D libraries, or expensive animations.
9. Do not delete functional components simply because their styling is outdated.
10. Do not claim completion without visual and functional verification.

**Design principle:**

Every section must have its own distinctive artistic composition while remaining part of one coherent visual identity.

---

# 02 — REAL CINEMATIC THEATRE PHOTOGRAPHY

The most important visual requirement is to use REAL, HIGH-QUALITY THEATRE PHOTOGRAPHY.

Do not create the entire theatrical environment using CSS gradients, abstract shapes, or generic illustrations.

## Photography direction

Find or use properly licensed, high-resolution photographs of:

- Luxurious classical theatre interiors.
- Deep burgundy velvet curtains.
- Cinematic theatre stages.
- Golden architectural details.
- Elegant auditorium interiors.
- Dramatic spotlights.
- Theatre balconies and decorative arches.
- Premium backstage corridors.

Preferred visual characteristics:

- Ultra-wide cinematic compositions.
- Strong architectural symmetry.
- Dramatic camera angles.
- Realistic depth and perspective.
- Warm amber lighting.
- Dark burgundy and gold tones.
- Large areas of negative space for readable UI.

## Asset requirements

- Prefer appropriately licensed images from Unsplash, Pexels, or existing authorized project assets.
- Inspect image licensing before use.
- Download selected images into the existing project's asset structure.
- Optimize using AVIF/WebP where supported.
- Create responsive image sizes.
- Never hotlink unreliable image URLs.
- Never use watermarked images.
- Never stretch low-resolution images.
- Preserve image attribution and license documentation where required.

## Background architecture

Build layered backgrounds using:

1. Real theatre photography.
2. Carefully controlled dark overlays.
3. Cinematic lighting gradients.
4. Subtle vignette effects.
5. Optional lightweight decorative curtain elements.
6. Foreground glassmorphism components.

The photograph must remain visibly recognizable.

Do not darken the image until the theatre disappears.

---

# 03 — GLOBAL DESIGN SYSTEM

Establish a unified visual language:

**Visual identity:** Royal Academic Theatre.

Suggested palette:

- Stage Black: `#160E19`
- Royal Burgundy: `#75283F`
- Deep Wine: `#461D32`
- Champagne Gold: `#D4AC6E`
- Warm Ivory: `#FFF1D6`
- Dusty Rose: `#B16A80`
- Glass White: `rgba(255,255,255,0.08)`

Create reusable design tokens for:

- Background overlays.
- Glass transparency.
- Blur intensity.
- Border colors.
- Light intensity.
- Typography.
- Shadows.
- Radius.
- Spacing.
- Motion duration.
- Responsive breakpoints.

## Glassmorphism

All major cards should feel like premium illuminated glass panels.

Use:

- Transparent surfaces.
- Subtle backdrop blur.
- Thin luminous borders.
- Carefully positioned light reflections.
- Soft inner highlights.
- Layered shadows.
- Elegant hover elevation.

Do not make every card identical.

Create visual variations while maintaining shared styling rules.

Ensure readable contrast and provide fallbacks where backdrop filters are unavailable.

---

# 04 — LANDING PAGE: COMPLETE SECTION-BY-SECTION REDESIGN

## SECTION A — HERO: THE GRAND OPENING

Create an unforgettable cinematic first impression.

### Background

Use a REAL luxury theatre stage photograph with a dramatic camera angle.

The image should occupy the full hero area.

### Composition

- Premium transparent navbar.
- RAQEEB logo with elegant lighting.
- Large Arabic headline.
- Beautifully styled subtitle.
- Clear primary CTA.
- Secondary exploration CTA.
- Theatre curtains framing the composition.
- Subtle animated golden lighting.
- Soft depth and atmospheric effects.

### Cinematic interaction

Introduce the hero with a lightweight curtain-reveal effect.

Do not block user interaction unnecessarily.

Avoid long loading animations.

Respect `prefers-reduced-motion`.

### Typography

Create a strong visual hierarchy:

- Large elegant Arabic headline.
- Selected words highlighted in champagne gold.
- Secondary text in warm ivory.
- Clear spacing and professional alignment.

### Required outcome

The hero must feel like the entrance to a prestigious academic theatre, not a generic SaaS template.

---

## SECTION B — TECHNOLOGIES: THE INNOVATION GALLERY

Give this section a unique visual identity.

### Concept

A futuristic technology exhibition located inside a classical theatre.

### Design

- Real theatre architecture in the background.
- Transparent technology cards.
- Official technology logos.
- Illuminated golden frames.
- Soft ambient light.
- Different card sizes where visually appropriate.

### Layout

Create a sophisticated responsive grid.

Each card should include:

- Official technology icon.
- Technology name.
- Short meaningful description.
- Premium hover effect.

### Connected lighting

Introduce subtle glowing connections between related cards where the content supports it.

The connections must be decorative and must not imply nonexistent technical integrations.

Do not list technologies that are not actually used by the project.

---

## SECTION C — ROLES: THREE THEATRE GATES

Create three distinctive role cards:

1. Student.
2. Doctor.
3. Administrator.

### Visual concept

Each role appears as an elegant theatre entrance or illuminated architectural portal.

### Student

Warm gold lighting with academic details.

### Doctor

Refined burgundy lighting with educational and professional symbolism.

### Administrator

Prestigious architectural styling with subtle ivory and gold highlights.

### Card requirements

- Transparent glass panel.
- Distinct role icon.
- Elegant border.
- Role description.
- Appropriate CTA.
- Soft spotlight.
- Premium hover transition.

### Security requirements

Role selection must not grant permissions.

Never allow public self-registration as an administrator.

Preserve existing authorization and role-validation logic.

---

## SECTION D — FEATURES: THE ILLUMINATED JOURNEY

This section must NOT look like another ordinary card grid.

### Concept

Create an illuminated staircase or connected journey through the platform's features.

Use a visually interconnected sequence of feature cards.

### Visual layout

- Alternating card positions.
- Glowing connecting lines.
- Numbered stages.
- Glass panels.
- Soft golden light.
- Responsive vertical progression on mobile.

### Feature examples

Only display features actually available or clearly labeled as upcoming:

- QR attendance.
- Lecture organization.
- Academic tasks.
- Student progress.
- Grade tracking.
- Academic notifications.

### Animation

As users scroll:

- Each stage reveals smoothly.
- Connecting lines illuminate progressively.
- Cards gain subtle light emphasis.
- Movement remains lightweight.

Avoid scroll-jacking and excessive parallax.

---

## SECTION E — FOOTER: THE GRAND FINALE

Completely redesign the existing footer.

The current developer card is visually unsatisfactory and must be replaced.

### Artistic direction

The footer should feel like the final scene of the academic theatre.

Use a real photograph of an elegant theatre interior or stage with dramatic lighting.

### Layout

Create three coordinated visual areas:

**Area 1 — Platform Identity**

- RAQEEB logo.
- Platform description.
- Important navigation links.
- Contact information where available.

**Area 2 — Academic Sponsorship**

Display the official identities of:

- Faculty of Science — Suez University.
- Suez University.
- BUDI — Developer Identity.

### Important branding rule

Present the academic relationship as:

"برعاية كلية العلوم — جامعة السويس"

Only use this wording publicly if the project owner confirms the sponsorship is formally authorized.

Otherwise use accurate neutral attribution such as:

"مشروع أكاديمي موجّه لقسم الرياضيات وعلوم الحاسب — كلية العلوم، جامعة السويس"

Do not imply institutional endorsement without confirmation.

### Official logos

Use authentic university and faculty logos from authorized sources.

Do not recreate official institutional marks using AI.

Maintain correct proportions and visual integrity.

### BUDI logo requirement

Reference website:

https://budi-portfolio-dev.vercel.app/

Inspect the navbar carefully.

Locate the current BUDI logo.

Reuse the exact existing transparent-background logo asset if it is available and authorized.

Do not invent a replacement or use a text approximation.

If the exact asset cannot be obtained, report the limitation and request the original file.

### Moving sponsor ribbon

Create an elegant horizontal animated logo marquee.

Requirements:

- Large visible logos.
- Transparent backgrounds.
- Consistent visual alignment.
- Soft golden illumination.
- Smooth continuous motion.
- Seamless looping.
- Pause on hover and keyboard focus.
- Reduced-motion support.
- Responsive layout.

Avoid tiny logos, excessive glow, or distorted images.

### Reference website

https://fudhailalqahali.me/site/ar/

Study the reference's brand-logo presentation, visual balance, spacing, and marquee concept.

Use it for inspiration only.

Do not copy its proprietary code, graphics, or complete layout.

**Area 3 — Developer Signature**

Replace the existing developer card entirely at the visual level.

Create a premium BUDI developer identity panel.

Include:

- Original BUDI logo.
- Developer name: Mohamed Abdallah.
- Frontend / Software Developer identity.
- Portfolio link.
- Elegant gold accents.
- Transparent premium glass surface.
- Subtle decorative lighting.

Make this card feel like a premium architectural signature integrated into the theatre, not a generic profile widget.

### Footer finishing details

- Elegant divider lines.
- Copyright with current year.
- Appropriate legal links if implemented.
- Consistent spacing.
- High-quality mobile layout.

---

# 05 — AUTHENTICATION PAGE: CRITICAL REPAIR

**CURRENT CRITICAL PROBLEM:**

The authentication card is barely visible or completely invisible.

The entire authentication page currently has poor visual quality.

This must be treated as a high-priority functional and visual defect.

## Step 1 — Diagnose

Investigate:

- Incorrect z-index.
- Stacking contexts.
- Absolute positioning.
- Parent overflow clipping.
- Opacity.
- Visibility.
- Display properties.
- Transform effects.
- Backdrop filters.
- CSS conflicts.
- Hydration problems.
- Responsive breakpoints.
- Animation initial states.
- Loading states.
- Theme conflicts.

Identify the actual root cause before applying changes.

## Step 2 — Rebuild the visual presentation

Preserve existing authentication functionality.

Create a premium theatrical authentication composition.

### Background

Use a real theatre photograph with an elegant cinematic angle.

### Login card

- Clearly visible.
- Centered or deliberately positioned.
- Premium transparent glass.
- Strong readable contrast.
- Golden luminous border.
- Elegant typography.
- Clear input labels.
- Distinctive primary CTA.
- Appropriate error and success states.

### Authentication functionality

Preserve:

- Login.
- Registration where permitted.
- Form validation.
- Password visibility.
- Password reset if implemented.
- Loading feedback.
- Existing Supabase authentication.
- Existing role handling.
- Error messages.
- Redirect behavior.

### Responsive requirements

On mobile, prioritize the form.

The card must never be hidden behind curtains, images, overlays, or decorative elements.

Avoid unnecessary animations that delay the appearance of the form.

### Acceptance requirement

The login card must be immediately visible, readable, keyboard accessible, and fully functional on all supported screen sizes.

---

# 06 — CINEMATIC LIGHTING SYSTEM

Lighting is one of the most important aspects of the redesign.

Develop a reusable visual lighting language:

- Warm golden spotlights.
- Soft ambient burgundy glow.
- Gentle edge illumination.
- Subtle reflective surfaces.
- Light trails between related elements.
- Illuminated borders.
- Carefully controlled hover highlights.

Avoid:

- Excessive neon.
- Distracting flashing effects.
- Heavy animated shadows.
- Unnecessary canvas rendering.
- Large GPU-intensive blur effects.

Lighting must enhance visual hierarchy rather than compete with the content.

---

# 07 — DESIGN QUALITY AND REFERENCE ANALYSIS

Before implementation:

1. Analyze the existing RAQEEB landing and authentication pages.
2. Inspect the BUDI portfolio navbar logo.
3. Analyze the supplied portfolio reference.
4. Identify reusable patterns without copying proprietary work.
5. Create a visual direction for each section.
6. Define a coherent typography and spacing system.
7. Validate the visual direction before large-scale implementation.

Do not use generic templates.

Do not randomly combine unrelated design trends.

The final result must feel custom-designed specifically for RAQEEB.

---

# 08 — EXECUTION PHASES

Execute strictly in this order:

**Phase 0:** Existing project audit and backup strategy.

**Phase 1:** Asset research, visual references, and design tokens.

**Phase 2:** Hero and navbar.

**Phase 3:** Technologies section.

**Phase 4:** Roles section.

**Phase 5:** Features and illuminated journey.

**Phase 6:** Footer, sponsorship ribbon, and developer signature.

**Phase 7:** Authentication page repair and redesign.

**Phase 8:** Responsive optimization and accessibility.

**Phase 9:** Performance optimization and regression testing.

**Phase 10:** Final documentation and delivery.

**Priority exception:** If the authentication card is currently unusable, repair its visibility immediately after Phase 0, then complete its full visual redesign in Phase 7.

For each phase:

1. Inspect the relevant existing files.
2. Explain the intended changes.
3. Implement the changes.
4. Run applicable checks.
5. Inspect the result visually when browser tools are available.
6. Fix discovered issues.
7. Document completed work.
8. Continue to the next phase only after verification.

Do not claim visual verification if screenshots or browser inspection were unavailable.

---

# 09 — LEGACY DESIGN CLEANUP

After replacing the old visual system:

- Remove obsolete CSS rules that are no longer referenced.
- Remove unused imports.
- Remove dead visual components after verifying they are not needed.
- Remove unused design assets safely.
- Resolve conflicting selectors.
- Consolidate duplicated styles.
- Remove obsolete animations.
- Verify there are no broken asset paths.

Do not blindly delete caches or dependency directories.

Clear only relevant disposable build caches when necessary.

Never delete user data, Supabase storage, environment variables, database content, or essential project files.

---

# 10 — FINAL ACCEPTANCE CRITERIA

The redesign is complete only when:

- Real theatre imagery is visibly integrated.
- Every landing section has a distinct artistic identity.
- Glass cards are readable and premium.
- The visual palette is coherent.
- Lighting is elegant and consistent.
- The hero feels cinematic.
- Technology cards are polished.
- Role cards are distinctive.
- Feature cards form an illuminated visual journey.
- Footer sponsorship branding is accurate and high-quality.
- The BUDI logo is authentic and properly rendered.
- The developer signature is completely redesigned.
- Authentication card visibility is fixed.
- Existing authentication functionality remains intact.
- Mobile layouts work correctly.
- No new console errors or broken assets are introduced.
- Applicable tests and production build pass.
- All changes are documented.

---

# 11 — FINAL DELIVERY REPORT

Produce:

1. Executive summary.
2. Section-by-section change log.
3. List of modified files.
4. List of added assets and their licenses.
5. Visual design decisions.
6. Authentication bug root cause and resolution.
7. Responsive verification results.
8. Performance findings.
9. Accessibility findings.
10. Remaining limitations, if any.

**FINAL DIRECTIVE:**

Do not simply decorate the existing website.

Reimagine the entire external RAQEEB experience as a coherent cinematic academic theatre.

Make every section feel intentional, premium, elegant, original, and production-ready.

Preserve the existing project's functionality while delivering the strongest visual experience possible.![alt text](image.png)  DESIGN NEW LOGO SAME IMAGE CREATIVELY