# Phase 01 handoff — Academic Theater public identity

## Delivered

- A public-only semantic token sheet, reusable framed surfaces, and a new original R/gate mark with light, dark, and favicon SVG variants.
- A first-visit double-door opening with a branded seal, honest indeterminate status, skip control, reduced-motion bypass, bounded wait, and same-session skip. The panels open outward in RTL and LTR layouts.
- A rebuilt public journey: architectural landing hero, three value pillars, eight feature exhibits, process, student/professor/admin gateways, security story, technology frames, and a coherent footer. The old welcome interstitial no longer interrupts the reveal.
- Shared authentication identity across login, registration, admin sign-in and password recovery. Gateway intent selects the correct registration role; it does not grant privileges. Professor approval and admin sign-in rules remain server-owned.
- Safer post-login `next` handling: a requested destination must belong to the authenticated role. Password recovery gained a proper dialog, keyboard focus cycle, Escape close, and a click fix for the login form's input blur.
- Removed public copy and metadata that implied a verified university publisher, invented operational certainty or bank-level security. Preserved real QR, reports, schedule and account functionality.

## Routes and boundaries

| Public route | Result |
| --- | --- |
| `/` | Landing page and first-session opening |
| `/login` | Existing login, registration and admin tabs |
| `/register` | Registration tab using the same card |
| `/login?tab=register&intent=student` | Student registration selected |
| `/login?tab=register&intent=professor` | Professor registration selected; server approval remains required |
| `/login?tab=admin&intent=admin` | Admin sign-in; no public admin creation |

Recovery remains a modal over the login page and uses the existing `/api/auth/forgot` and `/api/auth/reset` routes. There is no existing email verification route/provider to re-skin. No Student, Professor or Admin dashboard design was changed by Phase 01 work.

## Validation

- `npx tsc --noEmit` passed.
- Focused ESLint on edited TS/TSX files passed.
- Vitest passed: 10 files, 101 tests, including the new safe-return cases.
- `npx next build` passed with existing warnings outside this scope. The wrapper `npm run build` could not regenerate Prisma's Windows DLL because a pre-existing development process held it open; the same client compiled in the direct Next production build.
- Production-browser review: widths 320, 375, 768, 1024, 1440 and 1920 had no horizontal page overflow. All three gateway links were present and routed to their intended auth context. The first-session opening exited; repeat visits hid it. Reduced motion bypassed the opening. Password recovery opened, focused its email input and closed with Escape.
- Representative screenshots are in ignored `work/phase01-landing-375.png`, `work/phase01-landing-1440.png`, and `work/phase01-recovery-dev.png`.

## Environment and follow-up

The remote Neon database was unreachable from this machine during the browser review, so real account creation, email delivery and authenticated session persistence could not be tested end to end. The public UI used its existing metrics fallback and remained navigable. Re-run those connected flows when the database and mail delivery are available. The design currently leaves protected dashboards on their prior visual system; applying the foundation to them belongs to Phase 02.

The repository already contained extensive uncommitted changes from other work, including private portal and server files. This handoff covers only the public identity files listed above and does not assert OpenCode approval or collaboration.
