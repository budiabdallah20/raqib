---
title: Passkey (WebAuthn) — بصمة الجهاز الاختيارية
tags: [auth, passkey, webauthn, security, raqib]
sourceRefs: [src/lib/passkey-server.ts, src/lib/passkey-client.ts, src/app/api/auth/passkey/, prisma/schema.prisma, src/components/auth/LoginForm.tsx, src/components/auth/RegisterWizard.tsx]
lastReviewed: 2026-10-27
---

# Passkey في رقيب

الميزة الاختيارية المضافة كانك تفتح جهازك بالبصمة. مبني على **WebAuthn الفعلي**
(مكتبة `@simplewebauthn/*` v14) — ليس أي محاكاة.

## المعمارية

```
[تسجيل بصمة]
LoginForm/RegisterWizard → POST /api/auth/passkey/register-options  (يتطلب SESSION)
   → سعر FB challenge في كوكي pk_reg_chal (httpOnly، 120s)
→ navigator.credentials.create (بصمة الجهاز) → POST /register-verify
   → تحقق: origin + rpID + challenge → يحفظ المفتاح العام فقط في قاعدة البيانات

[دخول بالبصمة]
LoginForm → POST /api/auth/passkey/auth-options (عام, رابط اختياري)
   → challenge في كوكي pk_auth_chal
→ navigator.credentials.get (بصمة/وجه) → POST /auth-verify
   → تحقق → جلسة JWT + كوكي httpOnly (بنفس مسار الدخول بالباسورد)
```

## الأمان (كل استثمار فويه)

| الحماية | التنفيذ |
|---|---|
| لا تكرار تسجيل | التحدي في HTTPOnly cookie، مرات 120 ثانية، تتقفل بعد أول استخدام |
| origin/RP binding | `verifyRegistrationResponse/verifyAuthenticationResponse` مع `expectedOrigin` من الترويسة + rbID |
| كشف الاستنساخ | عداد التوقيع (counter) — إن عداد الجديد ≤ المحفوظ >0، ارفض (PASSKEY_CLONE_REJECTED) |
| فقط المفتاح العام | لا يوجد أي secret، يشير `publicKey Bytes` |
| عدّ السقوط | `assertRateLimit` مخصصة لكل مسار (20-30/15m/IP) |
| تدقيق كامل | logAudit: OPTIONS / REGISTERED / AUTH_OK / AUTH_FAIL / CLONE_REJECTED |
| لا وجود لمفاتيح | دخول بحساب غير نشط بـ403، بصمة غير مرتبطة بـ404 دوك بلا دلالة |

## قاعدة البيانات

جدول `PasskeyCredential`:
- id (credential ID base64url), userId → User (Cascade delete)
- publicKey Bytes, counter Int, transports CSV, deviceType single/multi, backedUp
- بلا بصمة مكررة: excludeCredentials in options.

## تدفقات الدخول UI

1. **LoginForm**: زر «دخول ببصمة الجهاز» — عام (بدون جلسة)، يظهر فقط للمتصفحات الداعمة.
2. **RegisterWizard**: بعد إنشاء حساب الطالب — شاشة الترحيب تمنحه خيارين
   «سجّل بصمتك» أو «ادخل لوحتك». الدكتور المعلّق لا يصل هنا (انتظار موافقة).
3. `BiometricCard` (بطاقات بصمة الشكلية السابقة) أزيلا — كانت زخرفة بلا عمل.

## بيئة

- `PASSKEY_RP_ID` بيئة (افتراضي `localhost`) — على الإنتاج نطاق الرابط الحقيقي.
- `PASSKEY_ORIGIN` اختياري لتأكيد origin إضافي.
