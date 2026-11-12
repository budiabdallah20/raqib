# Phase One — Academic Theatre rebuild review

Work started: 2026-11-09; verification completed: 2026-11-10. Scope: loading, landing, login and registration presentation. Baseline commit: `1321508`; the working tree already contained substantial uncommitted user work before this pass. Some public CSS files also changed in the shared workspace during verification, so this report describes the verified current result and does not attribute every line of those files to one agent.

## Audit and plan

- The requested `.docs/PHASE_01_ACADEMIC_THEATRE_REBUILD.md` path was absent. `RAQEEB_DESIGN_MASTER.md` contains the Phase One radical rebuild directive and was used as the design brief. The named Budi / Architect Mind skill packages were not found locally; their requested audit, design, implementation, critique and verification workflow was followed directly.
- The stack is Next.js 15 App Router, React 19, TypeScript, Tailwind 3, Framer Motion and Prisma. Public presentation is spread across `LandingPage.tsx`, the loading components, the auth card and separate theatre CSS files. Server auth, roles, data and private portals were outside this edit.
- Existing public pages already had a gate mark, stage frames, public story, short loader and framed auth. The weak point was the visual continuity: blue curtain textures and cool backgrounds diluted the requested red velvet theatre identity. The previous pass had already pulled the primary CTA into the first viewport.
- Plan executed: extend scoped tokens; use original CSS theatre fabric, proscenium and warm light; carry the fabric through loading, landing and auth; inspect at mobile/tablet/desktop; run checks.

## Public files affected and reviewed

| File | Change |
| --- | --- |
| `src/styles/academic-theater-tokens.css` | Added scoped burgundy curtain, spotlight, glass, motion and layer tokens. |
| `src/components/landing/landing-theatre.css` | Added velvet proscenium valance and side curtains, warmer hero stage and restrained burgundy accents on exhibits and role cards. |
| `src/app/(auth)/auth-theatre.css` | Matched auth drapes and card/header lighting to the public theatre language while retaining form contrast. |
| `src/components/shared/splash-theatre.css` | Restyled the short opening doors with burgundy depth and a clearer gold center seam. |
| This report | Recorded audit, implementation and verification. |

The existing `LandingPage.tsx` and other public implementation files were already modified before this pass; this pass did not change their behavior. No private portal, auth API, role rule, schema or production data was changed by this work. Because the files are untracked or previously modified, Git cannot isolate the contribution of this pass from concurrent work without an external handoff log.

## Visual review and corrections

- Viewed fresh screenshots for landing at 375, 768 and 1440px, auth at 375 and 1440px, and the first-visit opening at 1440px. The burgundy valance reads clearly at desktop and scales down without covering the mobile headline. The auth card remains the dominant surface, with burgundy limited to its rim and act plaque.
- Browser measurements found no horizontal overflow at the reviewed widths. The 375px primary landing action was at y≈564; the 1440px action was at y≈632 in a 900px viewport.
- The opening remains short, skippable and reduced-motion aware by its existing implementation. The styling update did not change its timing or state logic.
- Local review screenshots: `work/qa-design-landing-375.png`, `work/qa-design-landing-768.png`, `work/qa-design-landing-1440.png`, `work/qa-design-login-375.png`, `work/qa-design-register-375.png`, `work/qa-theatre-splash-1440.png`, `work/qa-theatre-login-1440.png`.

## Checks and known limits

- TypeScript: `npx tsc --noEmit` passed.
- Focused ESLint on public TS/TSX: passed without errors.
- Vitest: 10 files, 101 tests passed. Vite reported its existing native config loading warning.
- Browser: public and auth routes returned 200 in local Turbopack dev; registration role tabs were present; no horizontal overflow at 375/768/1440px.
- Production build: `NEXT_DIST_DIR=.next-phase01-final npx next build` passed. Next generated 77 static pages. Existing warnings remain for `<img>` in the professor pages and auth avatar, plus a `PomodoroTimer` `useMemo` dependency warning. The isolated build temporarily added its type directory to `tsconfig.json`; that automatic addition was removed afterward.
- Connected Neon sign-in, account creation, mail recovery, screen reader audit and Web Vitals were not exercised by this visual pass. They remain separate QA gates. Cached build attempts against `.next` and `.next-design-verify` saw mismatched local Lucide fingerprint paths while the installed package version changed; a fresh isolated directory built successfully without changing dependencies.
