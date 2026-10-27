---
title: Wiki Log
tags: [wiki, log]
lastReviewed: 2026-10-27
---

# Wiki Log

## [2026-10-27] ingest | raqib-passkey — بصمة الجهاز الاختيارية (WebAuthn v14)
- موديل PasskeyCredential + 4 مسارات API (options/verify للتسجيل والدخول) + عملاء السيرفر/المتصفح.
- الأمان: challenge عبر كوكي httpOnly قصيرة، تحقق Origin/rpID، عداد التوقيع كشفاً للاستنساخ، rate-limit + AuditLog.
- LoginForm: زر «دخول ببصمة الجهاز». RegisterWizard: عرض البصمة بعد إنشاء حساب الطالب (اختياري)؛ إزالة BiometricCard الشكلية.
- Wiki: entities/raqib-passkey.md.

## [2026-10-27] ingest | UI fixes (navbar light, LCP priority, splash big %, 3:4 frame)
- نافبار: عند الـscroll الخلفية أبيض مخضر `#f2f7ee/88` بحبر أخضر غامق؛ Clock/Date/Burger بمتغير `light` فوق الهيرو الشفاف.
- splash: نسبة التقدم رقم غروتسك متدرج متوهج + شريط 5px glass.
- فوتر: الصورة 3:4 بدون قص (225px) + priority.

## 2026-10-27 · seed | المشروع متغذي بعد التنظيف
`seed يستعرض نظرة عامة + خريطة صفحات + مواضع توربية البردج والديبด`. وأول نشاط عملي:
- تم حذف كاشات `.next` (90 MB) و `node_modules\.cache`.
- تم تشغيل tsc والبناء local production لإصدار قائمة الإيرورات.

## 2026-10-27 · ingest | Part-1 Redesign — Splash + Tech Tiles + Dev Card
- كتبنا SplashScreen جديد بنمط Budi: ترجمة آيات متغيرة، عداد % + ساعة `--:--:--`، خط JetBrains Mono (`font-coded`) وSpace Grotesk (`font-grotesk`) اتضافوا في layout/globals.
- LandingPage: بدّلنا شريط الماركيه القديم بسكشن «THAT'S WHAT I BUILD ON» — كورتي Techno (Tito style) بظل مائل علوي + ألوان نيون عبر TILE_COLORS + stagger-item.
- الفوتر: عمود التواصل اتشال من جريد 4 → 3 أعمدة، والكارت الجديد بيبني كل حاجة جواه: بورتريه `/brand/fotterfPicture.jpg` (fill) بإطار conic ذهبي + أقواس viewfinder + شارة Raqeeb creator، الاسم font-grotesk + chip «Open to work» live، لغات البناء (TECH_LOGOS chips ملونة)، صفوف التواصل (WhatsApp/Email/Phone بقيم حقيقية dir=ltr)، السوشيال 8 أيقونات، المسار: الموقع + BUDI Portfolio pill.
- i18n: اتضاف builtEyebrow/builtHeading/builtHeadingGold؛ باقي المفاتيح زي ما هي.
- Register: bug حقيقي — كلاينت كان يسمح بـ8 حروف بينما السيرفر اشترط 10; اتصلحت الرسالة والهينت.
