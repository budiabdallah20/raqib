# RAQIB — PHASE 2: BRAND IDENTITY, TECHNOLOGY AUDITORIUM, GRAND FINALE FOOTER & ADMISSION HALL

> MASTER EXECUTION PROMPT FOR CODEX / CHATGPT AGENT
> Project root: `C:\Users\Administrator\Desktop\raqib`
> Scope: EXTERNAL UI ONLY. Do not redesign or modify the Student, Instructor/Doctor, or Admin internal portals.

## Mission
Transform the external Raqib educational platform into an exceptional, performant, accessible **Academic Theater** experience. This is an implementation assignment, not a request for a mockup or a plan. Inspect the existing codebase first, then execute in ordered phases. Respect the real stack and architecture; do not assume a library or route exists.

## Non-negotiable engineering rules
1. Read package manifests, routes, asset structure, component tree, style tokens, authentication flow, environment-variable usage, and relevant git status before editing.
2. Preserve existing business logic, authentication providers, database schemas, RLS, authorization rules, student/doctor/admin routes, API contracts, redirects, localization and existing data. Do not touch the internal portal UI.
3. Create a git checkpoint or equivalent reversible backup before destructive edits. Never delete user assets or docs without inspecting their references and listing candidates. Do not expose secrets or commit `.env` files.
4. Use existing dependencies wherever possible. Avoid heavy 3D/WebGL, giant animation packages, redundant icon libraries, and unnecessary dependencies. Prefer CSS transforms and GPU-friendly opacity/transform animations.
5. Make every layout responsive at 320px, 375px, 768px, 1024px, and desktop widths. Support RTL Arabic and LTR English (and any other languages already in the app), keyboard navigation, focus visibility, contrast, reduced-motion, screen-reader labels, and correct semantic markup.
6. Do not invent university endorsements, staff affiliations, policies, official logos, personal details, or contact links. Verify source assets and institutional permissions. If sponsorship/endorsement is not established, use neutral factual attribution instead of claiming formal sponsorship, and mark the requested wording for owner approval.
7. Keep all new external UI styles scoped, avoid global collisions, and use design tokens rather than repeated hardcoded values.
8. Run lint, typecheck, tests, build and browser smoke checks as available; fix regressions. Never claim a test passed if it was not run.
9. Work in the existing repository. No separate replacement app, no invented mock backend, no broken placeholders.
10. Report what changed, paths, tests, remaining blockers, and the actual local server URL. A port number alone is not encrypted: if HTTPS is required, configure a proper TLS dev setup and report certificate trust requirements; otherwise label the URL HTTP.

## Design language
**Concept:** Raqib — The Academic Theater. Rich burgundy velvet, restrained stage gold, near-black, warm ivory, subtle copper lighting. Visual inspiration: theater curtains, auditorium chairs, stage frames, box-office tickets, elegant spotlights, proscenium arches. Sophisticated, calm and legible, never kitschy. Photo-real theater photography can be used as a compressed background with dark overlays and responsive crops. Do not bake essential text into images. Prefer real licensed/owned images; document attribution and licenses.

Suggested initial tokens (adapt to real UI and contrast testing):
- `--raqib-obsidian: #101016`
- `--raqib-burgundy: #390F20`
- `--raqib-curtain: #B84535`
- `--raqib-gold: #D6A35B`
- `--raqib-ivory: #F5EBDD`
- `--raqib-glass: rgba(255,255,255,.07)`
- `--raqib-border: rgba(214,163,91,.28)`

## Phase 0 — Reconnaissance and protection
- Confirm actual project root, app entry points, existing logo, loader, landing page, tech section, footer, login/register screens, auth handlers, existing localization files and public asset directories.
- Inspect `https://budi-portfolio-dev.vercel.app/` in a browser with developer tools. Identify the **exact transparent BUDI logo used in the navbar**, and the **actual developer portrait** from the portfolio. Trace image source URLs or assets and inspect their licensing/ownership. Do not use screenshots, generic avatars, or a fabricated BUDI logo. If inaccessible, ask the owner for the exact files; do not silently substitute.
- Inspect existing official institutional logo assets and verify logos from authoritative Suez University / Faculty of Science sources if necessary. Never invent official crests. Do not scrape unrelated third-party versions.
- Produce a brief implementation map and proceed.

## Phase 1 — New professional Raqib logo
Create a distinct, original, scalable Raqib visual identity. Explore 2–3 directions **within the existing codebase** (e.g., stage arch + academic gateway, open theater curtain + book, geometric letterform), select the strongest and implement it as clean SVG, not an emoji or rasterized text. Use editable vector paths, balanced proportions, optical alignment, and professional Arabic/Latin typography where supported. Deliver:
- primary horizontal lockup, compact emblem, monochrome light/dark variants, transparent versions, favicon/app icon, and accessible alt text;
- suitable dimensions for navbar, loader, mobile menu, auth and footer;
- no broken font dependencies, illegible micro-details or copied trademarked marks;
- replace only the existing external-facing Raqib logo usages; internal portals remain unchanged.
Check logo legibility at 24px, 48px and 160px. If a genuinely original logo requires creative review, implement a solid first candidate and present the alternatives as optional, without blocking other phases.

## Phase 2 — Technology Auditorium section
- Discover the **actual** technology stack from package manifests, lockfiles, source imports and deployment configuration. Only show technologies demonstrably used; do not claim unverified frameworks.
- Source authentic official technology SVG marks from the project's installed icon assets or reputable official brand repositories with suitable license. Preserve brand proportions and colors, use local optimized SVG where licensing permits, and accessible labels. Avoid generic icons for branded technologies.
- Design each technology tile as an elegant **theater-seat-inspired card**: recognizable backrest silhouette, seat cushion, subtle armrests, stage-light halo, layered glass face, logo mounted centrally, readable technology name, and optional concise function label. Use CSS pseudo-elements, gradients and SVG rather than 3D engines.
- Make a responsive auditorium layout: staggered seating on desktop, comfortable scrollable row or compact grid on mobile. Add restrained hover/focus spotlight, no excessive parallax. Do not make essential information hover-only.
- Provide a coherent section heading, subheading, optional categories such as Frontend / Backend / Infrastructure **only if verified**, and a tasteful transition from the preceding section.
- Ensure logos load locally, cards do not clip, animation honors `prefers-reduced-motion`, and there is no FPS regression.

## Phase 3 — Grand Finale footer (high priority)
Rebuild the **external landing footer** as the most memorable closing scene, with clear information architecture and strong usability. Avoid turning it into a crowded poster.

### A. Developer showcase
- Use the actual developer portrait from the owner's BUDI portfolio `https://budi-portfolio-dev.vercel.app/` (not an AI-generated face). Large editorial portrait, elegant spotlight, subtle architectural frame, responsive crop, meaningful alt text.
- Use verified portfolio details, not guessed biographical/contact information. Candidate fields to verify: Mohamed Abdallah Mohamed, frontend/web developer, Faculty of Science / Mathematics & Computer Science, Suez University, Suez, Egypt. Never invent email, phone, social accounts, role or university employment.
- Include concise bio, portfolio link, verified official social/contact icons and working external links. Use correct `rel="noopener noreferrer"` for new-tab links.
- Add an authentic transparent BUDI navbar logo sourced from the actual portfolio, preserving its transparency and aspect ratio.

### B. Institutional attribution
- Include clearly separated institutional identity area with **official** Faculty of Science and Suez University logos if verified and permission/brand use is appropriate, plus BUDI identity. The user requests the wording “تم بناء الموقع برعاية كلية العلوم وجامعة السويس وبودي”. **Do not publish a sponsorship claim without explicit owner confirmation and evidence of institutional approval.** Until then, display a neutral, truthful attribution such as “منصة تعليمية تجريبية لقسم الرياضيات وعلوم الحاسب” where factually appropriate, and mark the sponsorship wording for approval.
- Arrange verified marks in a refined large-logo horizontal strip with subtle LED separators or a slow marquee only if accessibility and reduced-motion are respected. Pause on hover/focus, no visual distortion, and use static layout if only three marks.
- Link official institutions to verified official destinations. Do not imply they endorse the product through design alone.

### C. Footer navigation and legal
- Add navigation: About Raqib, Platform Features, Technology, Portal Access, Contact, Help/FAQ as relevant to actual routes.
- Provide discoverable legal links: Privacy Policy, Terms of Use, Cookie Policy (only if cookies/analytics require it), Accessibility, and Copyright / Intellectual Property. Implement real readable content/pages or modal views based on the platform's actual practices; do not fabricate compliance certifications or privacy guarantees.
- Privacy policy must accurately describe data categories, purpose, access roles, retention/deletion, user rights, processors, and contact method; mark unknown operational facts for owner/legal review. Terms must avoid unsupported claims. Do not auto-accept consent or display fake security badges.
- Display dynamic current year for copyright; distinguish project ownership, developer credit, and university trademarks. Provide back-to-top, keyboard-accessible links, and mobile-friendly spacing.
- Optional polished touches: fine stage-floor gradient, soft golden light sweep, tasteful moving ribbon, illuminated border, microinteractions. Keep text legible and all animations lightweight.

## Phase 4 — Admission Hall: entirely redesigned external authentication UI
Build a radically improved **login / registration experience** with the metaphor of entering an academic theater, not a copy of the landing hero.

### UX architecture
- Clear entry choice between Sign In and Create Account (where account creation is permitted).
- Role presentation (Student, Doctor/Instructor, Admin) must reflect **actual authorization**. Never allow self-registration or role elevation to Doctor/Admin unless existing backend policies explicitly permit it. Role cards may guide users to the correct flow but never grant privileges.
- The central auth form should look like a refined **admission ticket / stage entrance** mounted on an accessible translucent panel, with a distinct but related photographic or CSS theatrical background.
- Strong hierarchy: title, supportive subtitle, role context, labels, form controls, inline errors, submit state, alternative sign-in methods **only if actually implemented**, password visibility toggle, forgot-password path if supported, and link to switch auth mode.
- Preserve the actual validation schemas, CSRF/session protections, Supabase/other auth integration, email verification and redirects. Never bypass security to improve the visual demo.
- Show errors without leaking sensitive auth details; prevent duplicate submissions, retain entered non-secret fields on recoverable errors, use autocomplete attributes, and do not log credentials.
- Mobile first: keyboard does not obscure form; no clipping, horizontal scroll, unreadable glass, or hidden CTAs. Consider reduced data / slow devices.
- Distinct microinteractions: opening gate frame, ticket-edge highlight, focus spotlight, gentle success transition, all using CSS transforms/opacity and reduced-motion fallbacks.
- Ensure Arabic RTL and English LTR work correctly, including form alignment, password input direction, icons and validation messages.

## Phase 5 — Integration and QA
1. Run install only when necessary, then clean and start the existing dev server; show actual URL, port, protocol and startup logs. Do not claim encryption without TLS.
2. Check loading screen logo references remain valid and the theater curtain intro still works without blocking navigation. Only adjust it as required for the new logo.
3. Verify landing links, logo variants, technology card assets, image loading, footer links, legal routes, login, registration, reset flow if available, redirect destinations, and unauthorized access behavior.
4. Verify all three existing internal portals still work and were not redesigned. Check route-level authorization; do not change backend privileges.
5. Run lint, typecheck, unit/integration tests and production build. Browser-test desktop and mobile, dark photo overlays, keyboard, reduced-motion, RTL and image lazy loading.
6. Optimize assets: SVG logo, compressed WebP/AVIF theater photos and portrait when appropriate, width/height or aspect ratio to avoid layout shifts, lazy load below-the-fold images, preload only genuinely critical hero assets.
7. Provide final changelog by file, before/after description, verified sources for external logos/photos, any licensing/permission blockers, tests with actual results, and remaining TODOs.

## Acceptance criteria — do not mark complete unless true
- [ ] Original polished Raqib logo delivered in usable variants and integrated into external UI.
- [ ] Technology section shows **verified stack** with authentic marks and theater-chair-inspired responsive cards.
- [ ] Footer uses **actual** developer portrait and **exact** transparent BUDI navbar logo from the provided portfolio, or explicitly reports asset access blocker.
- [ ] Faculty/University official marks are authentic, attribution truthful, and sponsorship claim gated on approval.
- [ ] Footer has real working navigation and legal destinations, verified contact/social links, and dynamic copyright year.
- [ ] External login/register pages have a fresh, distinctive, accessible theater-admission UX without changing backend privileges.
- [ ] Existing Student/Doctor/Admin internal UI and routes are preserved.
- [ ] RTL, responsiveness, accessibility, reduced-motion, performance, auth smoke tests and production build are checked and reported.

## Required final response format
1. **Implemented:** concise phase-by-phase summary.
2. **Changed files:** actual paths.
3. **Verified external assets:** URL/source and license/permission status.
4. **QA:** exact commands and pass/fail results; mention unrun tests.
5. **Server:** real localhost URL and HTTP vs HTTPS status.
6. **Owner decisions:** sponsorship permission, missing official assets, unresolved legal-policy facts.

Start by inspecting the repository. Execute the phases in order. Do not merely summarize these instructions.

---

## التنفيذ الفعلي — 2026-11-13

### النطاق والحماية
- نفّذ Codex هذه المهمة بناءً على تكليف المستخدم الصريح لهذا الملف. لم يُستخدم OpenCode أو تنسيق وكلاء، ولم يُدّعَ ذلك.
- العمل داخل المشروع الحالي؛ لم تتغير قاعدة البيانات أو API أو مخططات Prisma أو صلاحيات الأدوار أو صفحات الطالب/الدكتور/الإدارة.
- توجد تعديلات مستخدم كثيرة سابقة. حُفظت نسخ الملفات قبل التعديل في `work/phase2-backup/` بامتداد `.bak` خارج فحص TypeScript. لم يُحذف شيء ولم يُنشأ commit أو deployment.
- خط الأساس: `npm test` = 101/101، TypeScript وLint ناجحان مع التحذيرات الأربعة المعروفة. نسخة البناء السابقة كانت موثقة في ملف المرحلة الأولى.

### المراحل المنفذة
1. **الشعار:** إعادة رسم هندسي متجهي وفق المرجع الذي أرسله المستخدم، بلون Stage Gold؛ الرمز ونسخ ivory/obsidian/burgundy والـwordmark المتجهي بدون اعتماد على خط، وأيقونات 32/192/512. جرى تحديث أصول الواجهات الخارجية فقط. الشكل اختيار المستخدم، وليس ادعاء ابتكار مستقل عن مرجعه أو فحص تسجيل علامة تجارية.
2. **Technology Auditorium:** اثنتا عشرة تقنية متحققة من المشروع: Next.js، React، TypeScript، Tailwind، Node.js، Prisma، PostgreSQL، Neon، SQLite للاختبار المحلي، Framer Motion، Vercel لإعداد النشر، GitHub للمستودع. بطاقات الكراسي CSS بدون WebGL، وشعارات SVG محلية، وصورة الكرسي المقدمة من المستخدم. لم نعرض Neon Auth أو Neon Realtime لأن الكود لا يثبت استعمالهما.
3. **Grand Finale:** صورة المطور الحقيقية وشعار BUDI الفعلي من الموقع المباشر، بيانات وروابط تواصل متحققة، علامات جامعة السويس وكلية العلوم من الموقع الرسمي، شريط زخرفي يتحرك ويحترم reduced-motion، روابط الأقسام والسياسات والحقوق وإمكانية الوصول والعودة للأعلى. التعريف المؤسسي محايد وينفي ادعاء الرعاية.
4. **Admission Hall:** خلفية قاعة الدخول وصورة البهو المقدمتان، بطاقة تصريح دخول بفواصل تذكرة، ترتيب واضح للنماذج، مرحلة تسجيل واحدة في كل مرة مع حفظ الحالة عند الرجوع. لم يتغير payload أو التحقق أو منح الأدوار. إنشاء حساب عضو هيئة التدريس ما زال pending لموافقة الإدارة؛ لا تسجيل ذاتي للإدارة.
5. **اللغة والسياسات:** ملف `auth-copy.ts` لترجمة 172 عبارة عرض في الدخول/التسجيل/الاستعادة/الإدارة؛ labels والأخطاء المحلية الرئيسية بالعربية والإنجليزية. رسائل السيرفر الديناميكية والمحتوى القانوني المعتمد حاليًا قد يبقيان بالعربية. صححت نص تعريف الدخول ليذكر الرقم الجامعي بدل الاسم (مطابقة للسيرفر)، ونصوص التشفير والحذف غير الدقيقة. أضيفت معلومات مزودي التشغيل وغياب مدة احتفاظ معتمدة ووسيلة طلب التصحيح. التركيز في نافذة السياسات محصور ويعود للعنصر الذي فتحها.

### الملفات الأساسية
- `src/components/landing/TechnologyAuditorium.tsx`, `GrandFinale.tsx`, `phase-two.css`, `AcademicTheater.tsx`.
- `src/components/auth/AdmissionTicket.tsx`, `admission-hall.css`, `TheaterLobby.tsx`, `AuthCard.tsx`, `RegisterWizard.tsx`, `LoginForm.tsx`, `AdminForm.tsx`, `ForgotPasswordModal.tsx`, `fields.tsx`, `PolicyModal.tsx`, `auth-copy.ts`.
- `public/brand/stage-*.svg`, `stage-icon-*.png`, `budi-portfolio.svg`, `technology/*.svg`.
- `public/images/phase2/*`; assets are local, sized, compressed, and below-fold images lazy-loaded.

### المصادر الفعلية وحقوق الاستخدام
- البورتفوليو فُتح بمتصفح Chromium وتم فحص DOM ومصادر الصور: https://budi-portfolio-dev.vercel.app/ . بيانات الاسم Mohamed Abdallah، Full-Stack/Frontend Developer، Suez Egypt، البريد والهاتف وروابط التواصل متحققة من الموقع والكود المحلي للمالك.
- شعار navbar الفعلي: https://budi-portfolio-dev.vercel.app/brand/budi-icon-light.svg . نُسخ كما هو إلى `public/brand/budi-portfolio.svg` مع شفافيته ونسبه، دون إعادة اختراع. الصورة المعروضة تحمل alt `Portrait of Mohamed Abdallah` وتُرسل من الموقع كـ data URI؛ حُفظ محتواها الفعلي محليًا ثم ضغطها إلى WebP. `work/phase2-portfolio-images.json` يسجل مصادر الصور بدون نسخ base64 إلى السجل.
- علامة الجامعة الرسمية: https://suezuni.edu.eg/imgs/logo.png . علامة الكلية: https://suezuni.edu.eg/Upload/Entity/LogoA/17/Fac%20Logo.jpg . وجهة الجامعة https://suezuni.edu.eg/ ووجهة الكلية https://suezuni.edu.eg/Sci/college/Index . هذه علامات تعريف وليست ترخيص رعاية. لم يُقدَّم دليل موافقة الجامعة على إعلان رعاية؛ عبارة «برعاية» لم تُنشر.
- علامات التقنية: الملفات المناظرة في https://github.com/simple-icons/simple-icons/tree/develop/icons . جرى تنزيل الملفات الأصلية مع الحفاظ على هندستها وإضافة ألوان الهوية المناسبة للخلفية. بيانات مستودع Simple Icons منشورة تحت CC0، لكن العلامات التجارية وقيود العلامة تبقى لأصحابها؛ راجع https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md . نُسخ LICENSE وDISCLAIMER محليًا بجانب الأصول. لم يُدّعَ ارتباط تجاري بأصحاب التقنيات.
- صور الكرسي/البهو/القاعة من المرفقات التي طلب المستخدم إضافتها. الاستخدام مصرح به من المستخدم للمهمة؛ لم يُقدَّم ترخيص طرف ثالث مستقل ولم تُزَل علامات مائية. لوجو المرجع أُعيد رسم هندسته من توجيه المستخدم وليس اقتصاص لقطة الموقع.
- أحجام WebP: الكرسي 118824 bytes، البهو 136722، قاعة الدخول 299670، الصورة الشخصية 127794. الشعار SVG صغير وقابل للتحرير.

### التحقق حتى هذه النقطة
- `npx tsc --noEmit`: PASS بعد تنفيذ الواجهات والترجمة.
- `npm run lint`: PASS، نفس 4 warnings سابقة (صور professor board/dashboard/AvatarUpload وPomodoroTimer hook).
- `npm test`: PASS، 10 ملفات / 101 اختبار.
- فحص التطوير: 18 حالة صفحة/مقاس، بدون overflow: `/`, `/login`, `/register` في 320/375/768/1024/1440/1920. خطوات التسجيل المفردة وحفظ الاسم عند الرجوع نجحت. احتاج فحص زر الاستعادة انتظار hydration لترجمة الإنجليزية؛ عُدّل الانتظار في سكربت المراجعة.
- يُعاد البناء الإنتاجي من مصادر ثابتة، ثم ستُضاف النتائج النهائية أدناه. اختبارات UI المعزولة التي تُرسل نماذج تستخدم اعتراضًا محليًا للطلبات وبيانات synthetic فقط، وليست إثباتًا لدخول حقيقي لقاعدة الإنتاج.

### قرارات المالك المفتوحة
- صياغة الرعاية المؤسسية تحتاج دليل اعتماد؛ البديل المحايد نُفّذ دون تعطيل المهمة.
- مدد الاحتفاظ، مسؤول التشغيل القانوني، مواقع المعالجة وأزمنة الاستجابة تحتاج اعتمادًا تشغيليًا/قانونيًا، والنص يصرح بما لم يُحسم.
- اختبار جلسات حقيقية للأدوار الثلاثة يحتاج حسابات synthetic معتمدة. لم تُستخدم حسابات شخصية أو تُنشأ حسابات ذات صلاحيات في الإنتاج.

### Final local verification — 2026-11-13
- Production build: `npm run build` PASS, 77 pages; landing first-load JavaScript 130 kB.
- `node work/phase2-review.cjs`: PASS, 18 route/viewport combinations (320–1920px), zero horizontal overflow, zero browser page errors, registration step progression/back retention and English recovery.
- `node work/phase2-auth-contract.cjs`: PASS, intercepted synthetic registration/login requests; staff approval-pending state, password visibility, error retention, policy dialog Escape, all 21 selected image elements decoded.
- `node work/external-resilience-review.cjs`: PASS, skip link, 200% zoom, image-failure fallback, slow-network intro, unauthorized portal redirects. Local timing is not a Core Web Vitals certification.
- Firefox/WebKit, full screen-reader audit and real authenticated role sessions are not verified.

### Subsequent release authorization
The user then requested GitHub push, Vercel production update and environment/ignore-file maintenance. After disclosure of pre-existing uncommitted portal/API changes and four missing exam tables, the user requested the best complete working release. The release therefore includes the existing local application work as well as this external redesign; those earlier changes are not attributed to this design implementation.
- Added ignore protection for work/, backups, generated builds and local Neon experiments; regenerated a clean secret-free `.env.example` and added `.vercelignore`.
- Source candidate scan: 449 files, zero matches for the checked credential URL/token/private-key/JWT patterns. This is a targeted scan, not a guarantee against every secret pattern.
- Confirmed GitHub origin budiabdallah20/raqib and Vercel project prj_FwM4oKB2rVx3G7tIFfXgBfEVGMsx, team team_1t7AljRKNDiROAYSs17EFabr, canonical https://raqibdev.vercel.app.
- Configured missing production DATABASE_URL, DATABASE_URL_UNPOOLED and the existing PII_ENCRYPTION_KEY using stdin without logging values. Preserved existing JWT/admin secrets. Added canonical PASSKEY_ORIGIN; public URL, RP ID, proxy trust and hidden development reset codes already matched production.
- Applied reviewed transactional additive SQL for Exam, Question, ExamAttempt and StudentAnswer, their indexes and foreign keys. No existing table/data deletion, no seeding, no secret/key rotation.
- Optional Resend email and complete server-side Google Drive OAuth credentials are unavailable locally and remain unconfigured. Do not claim password-reset email delivery or serverless Drive uploads are verified.
