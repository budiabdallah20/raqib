# RAQEEB — DESIGN_SYSTEM (Agent A / OpenCode)

> **المالك:** Agent A — الهوية البصرية والصفحات العامة ومكوّنات العرض فقط.
> **المرجع:** `RAQEEB_MASTER_AGENTS.md §2/§9` + الهوية المنفّذة فعليًا في `tailwind.config.ts` و `src/app/globals.css` و Ultimate v6 §2.1.
> عند الخلاف بين المسوّدة (بنفسجي `#8b5cf6`) والسلوك المنفّذ (ذهبي × ليموني × فحمي)، يُعتمد المنفّذ حسب `AGENTS.md`.
> **البوابات الثلاثة** (طالب/دكتور/أدمن) خارج هذا المستند — يملكها Codex.

## 1) الهوية الفاخرة — Obsidian Luxury

- **الفحمي العميق:** `#060805` (خلفية القوة A) · `#0B1120` (سطح مرتفع) · `#111C32` (سطح مُعلّى) · حدود `#263654` / `white/10`
- **الذهبي الملكي:** `#C8A24B` الأساسي · `#E6CB78` العالي · `#8A6424` العميق — لتوقيع رقيب والأزرار Primary
- **الليموني النابض:** `#A3E635` — للثقة والحالة الحيّة فقط (حضور حيّ، نجاح، تقدّم)
- **النص:** `#F8FAFC` رئيسي · `#94A3B8` ثانوي — تباين WCAG AA+ على الفحمي
- **بصمات البوابات (للعرض فقط — المنطق عند Codex):** أدمن ذهبي `#F59E0B` · دكتور زمردي `#10B981` · طالب نيلي `#6366F1`
- **الخط:** Cairo للعربي · Inter لللاتيني — `font-display = Cairo`, `font-latin = Inter`
- **المسافة:** إيقاع 8px · نصف قطر البطاقات 12–30px · ظلال هادئة بلا blur متحرك

## 2) مكوّنات القوة A

| المكوّن | الملف | ملاحظة |
|---|---|---|
| شاشة التحميل (Preloader) | `src/components/shared/SplashScreen.tsx` | سداسي ذهبي + `rqb-draw` + جمل متغيّرة + نسبة ذهبية |
| الهبوط `/` | `src/components/landing/LandingPage.tsx` | بطل فاخر + عدادات حية `NumberTicker` + بوابات |
| التسجيل `/register` | `src/app/(auth)/register/page.tsx` → `AuthCard` | لا منطق هنا — العرض فقط |
| الدخول `/login` | `src/app/(auth)/login/page.tsx` → `AuthCard` | نفس الكارت — تبويبات الثلاثة |
| إطار الدخول (Auth frame) | `src/components/auth/AuthCard.tsx` | شريط ذهبي/ليموني، زجاج أوبسيديان، فوتر ثقة |
| لوحة القصة | `src/components/shared/BrandPanel.tsx` | ذهبي/ليموني — بلا أزرق سادة |
| حقول التحقق | `src/components/auth/fields.tsx` | فوكس ذهبي، نجاح ليموني، خطأ أحمر، قوة كلمة المرور |
| تسجيل الدخول | `src/components/auth/LoginForm.tsx` | شارة ذهبية، بصمة ليمونية، روابط ذهبية |
| معالج التسجيل | `src/components/auth/RegisterWizard.tsx` | 3 خطوات + تقدم ذهبي/ليموني + بطاقات ذهبية |
| لاياوت الدخول | `src/app/(auth)/layout.tsx` | توهّجات ذهبية/ليمونية + روابط فوکس ذهبي |

**قاعدة:** لم يُمس منطق `validateAll` ولا `api('/api/auth/register')` ولا honeypot ولا `studentCode/level/group` سيرفريًا.

## 3) الحماية والتخزين والتشفير — تحقق قراءة فقط (لا تعديل منطق)

> تُنسب هذه الطبقات للمالك الآن في تعيين المالك، لكن أي تغيير منطقي يحتاج مراجعة أمنية منفصلة. التحقق هنا سليم كما هو — لم يُغيَّر كودها في مهمة الفخامة.

- **الحماية:** `src/middleware.ts` (CSRF `sameOrigin` + حدود 1MB/25MB + JWT role redirect) + `src/lib/csp.ts` (`nonce` + `frame-ancestors none`) + `next.config.js` (HSTS preload, nosniff, COOP/CORP/COEP, `X-Robots-Tag noindex` للبوابات) + `src/lib/env.ts` (فشل مغلق في الإنتاج)
- **التخزين:** `src/lib/storage.ts` (`safePath` ضد path traversal + `RESOURCE_NAME_RE/TASK_NAME_RE` صارمة + توقيع HMAC يربط الملف بصاحبه) + التنزيل عبر `/api/files/*` فقط
- **التشفير:** `src/lib/crypto.ts` (AES-256-GCM + HKDF لكل حقل + AAD = السياق) + `src/lib/db.ts` (حتمي لـ `email/phone/studentCode/nationalId` فقط للبحث بالمساواة، عشوائي للحقول الحرة) + `src/lib/env.ts` (رفض مفاتيح ضعيفة وناقصة في الإنتاج)

## 4) الحركة والوصولية والموبايل

- دخول أقل من 250ms لكل عنصر (`EASE [0.22,1,0.36,1]`)، `stagger` خفيف، لا أنيميشن يحجب مهمة
- `prefers-reduced-motion` في `globals.css` + `useReducedMotion` في Splash والهبوط
- `:focus-visible` حلقة ذهبية `#C8A24B` — كل تفاعل أساسي ≥44px (`min-h-[44px]` على الحقول والأزرار)
- RTL كامل (Cairo) + LTR للاتيني، `dir` من `useLang` — لا تخزين سلطوي في `localStorage` (فقط `lang` وتفضيلات العرض)
- `content-visibility:auto` للأقسام الطويلة + `tabular-nums` للعدادات

## 5) مسؤوليات Agent B (خارج النطاق)

الـ API، الـ DB migrations/RLS، جلسات Auth، توجيه الأدوار، منطق البوابات الثلاثة، الـ workflows، الـ audit log، واختبارات التكامل belong لـ Codex per `RAQEEB_MASTER_AGENTS.md §9`. أي تنسيق بين الوكيلين يحتاج orchestrator وسجلّ `handoffs/` — غير موجود حاليًا، فلا يُدَّعى تنسيق.
