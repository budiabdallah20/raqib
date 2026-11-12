# رقيب 2026 — محفظة الابتكار (RAQEEB Innovation Portfolio)

> **التاريخ:** 2026-11-07 · **الجهة:** قسم الرياضيات وعلوم الحاسب — كلية العلوم، جامعة السويس · **النطاق:** منصة رقيب المجانية (Free/Near-Free)
> **المؤلف:** Principal Engineer + Innovation Lead · **الحالة:** مسودة للمراجعة — لم تُنفَّذ أي شفرة بعد، ولا تغيير في قاعدة البيانات.
> **مبدأ حاكم:** كل فكرة في هذه الوثيقة مبنية على ما **موجود فعلاً** في المستودع اليوم (انظر القسم 2)، وتستعمل نفس الحزمة التقنية: Next.js 15 API Routes + Prisma + QR + PWA + Passkeys + Google Drive + Resend (free tier). لا اشتراك مدفوع، لا سيرفرات إضافية، لا بيانات شخصية تُرسل لأي مزود ذكاء اصطناعي دون ضوابط موافقة.

---

## 0. الملخص التنفيذي (Executive Summary) — 10 أسطر

1. رقيب منصة حضور QR ذكية تعمل اليوم بثلاث بوابات (طالب/دكتور/أدمن) على بنية مجانية بالكامل تقريباً.
2. اليوم المنصة قوية في الحضور والجدول والدرجات اليدوية، وضعيفة في: الذكاء الاصطناعي (صفر كود AI)، الرادار الاستباقي للطلاب المعرضين للحرمان، والعمل دون إنترنت.
3. المحفظة تقترح 12 ابتكاراً؛ كلها على الحزمة الموجودة (Prisma/Next.js/QR/PWA/Passkeys/Drive/Resend) بلا أي اشتراك مدفوع.
4. الفوز السريع: (1) **رادار الخطر المبكر** — تسجيل مرجّح للطالب المعرض للحرمان لكل دكتور؛ (2) **لوحة توزيع الدرجات** للدكتور مع تصدير CSV؛ (3) **رقيب أوف لاين** — Service Worker + PWA حقيقية.
5. الرهان الرئيسي (Flagship): **رادار رقيب الحصيف — Raqib Sentinel**: طبقة مكافحة وكيل الغياب (buddy-proxy) مبنية على إشارات المسح الموجودة (nonce/geofence/time-window/passkey counter/device fingerprint) مع صندوق مراجعة للدكتور — وهو الاسم نفسه للمنصة: رَقيب = مَن يرى.
6. الذكاء الاصطناعي يدخل عبر **مساعد رقيب الذكي (RAG)** كمشروع الربع القادم — مشروطاً بموافقة الخصوصية وحصة Gemini Flash-Lite المجانية.
7. كل فكرة تُقاس بأرقام (دقة التنبيهات، معدل الاستجابة، الوقت الموفّر) لا بمظاهر.
8. التكلفة التشغيلية للمحفظة كلها ≈ $0/شهر على الحصص المجانية (Resend ≈ 100 بريد/يوم، Neon free، Vercel Hobby، Gemini free tier) — مع مراقبة صارمة للحصص.
9. الترتيب المقترح: 30 يوم = الفوزات السريعة الثلاثة + تأسيس Sentinel؛ 60 يوم = Sentinel كامل + Digest الأسبوعي؛ 90 يوم = RAG تجريبي على مادة واحدة بموافقة الخصوصية.
10. نجاح المحفظة يُقاس بثلاثة أرقام: ↓ حالات الحرمان المفاجئة 50%، ↑ تغطية المسح بإشارات ≥90%، ↑ رضا الدكاترة عن التنبيهات ≥70%.

---

## 1. نطاق الوثيقة وطريقة القراءة

- **الجمهور:** مالك المشروع (Owner) + فريق رقيب (مهندس واجهة + مطور خلفية + مدرس مشرف).
- **ما هو**: محفظة ابتكار + خطة تنفيذ مرتبطة بالمستودع (routes/models/scripts) + مقاييس نجاح + خارطة 30/60/90.
- **ما ليس هو**: ليس تصريح تنفيذ. التنفيذ يلتزم بـ `agent.md` (Phase discipline, owner approval قبل كل طور)، ولا يُلمس anything في هذه الوثيقة قبل موافقة المالك.
- **الترميز:** كل فكرة تحمل Impact (H/M/L) · Effort (S/M/L) · Cost (free/near-free) · المخاطر · مسار التنفيذ داخل هذا الكود.

---

## 2. ما هو موجود اليوم — لقطة مبنية على الأدلة (Evidence-Based Snapshot)

### 2.1 الحزمة التقنية (متحقق منها في المستودع)
- Next.js 15 App Router · React 19 · TypeScript strict · Prisma 5.22 · Tailwind 3 (RTL، Cairo+Inter) · `server.mjs` HTTPS TLS 1.3 (bind 0.0.0.0 prod / localhost dev) — `project-audit.md §1`.
- قاعدة البيانات: canonical `prisma/schema.prisma` (SQLite محلياً) · الإنتاج Neon Postgres عبر `scripts/prisma-dialect.mjs` → `schema-postgres.generated.prisma` + `directUrl` — لا توجد `prisma/migrations/`، فقط `db push`.
- Auth: JWT HS256 مخصص (`iss=raqib/aud=raqib-web`) + جدول `Session` (tokenHash/sha256، revokedAt) + Passkeys WebAuthn (@simplewebauthn) + vault code (16-digit bcrypt) — `src/lib/jwt.ts`، `src/lib/session.ts`، `src/lib/passkey-*.ts`.
- التخزين: `storage/` محلياً + Google Drive عبر rclone/REST (`src/lib/drive.ts`)، الرفع يُمر عبر `/api/files/*` مع authz.
- التشفير: PII AES-256-GCM شفاف (`src/lib/db.ts`) + نسخ Drive مشفرة AES-256-GCM (`scripts/db-backup-drive.mjs`).
- البريد: Resend عبر fetch مباشر (`src/lib/notify.ts`, `src/lib/mailer.ts`) — مجاني ضمن حصة Resend، بلا مكتبة.
- الاختبارات: 41 اختبار Vitest (crypto/QR/policy/settings/exporters) + 3 رحلات Playwright (admin/professor/student) — `tests/`، CI في `.github/workflows/verify.yml`.

### 2.2 ما يعمل فعلاً (DB-backed)
- **الطالب:** Dashboard بـ15 ويدجت (HealthIndex، AbsenceRadar، GpaWhatIf، StudyPlanner، PomodoroTimer، Notes…) — `src/app/student/*`، `src/components/student/*`، مخطط BRAND.md §Blueprint v5 (25 ميزة منفذة).
- **الحضور QR:** رمز JWT HS256 دوّار TTL≈15 ث (`src/lib/qr-sign.ts`)، geofence JSON `{lat,lng,radiusM}` في `Lecture.geofence`، كود يدوي 6 أرقام HMAC (`src/lib/qr.ts` `manualCodeOf`)، تحقق Passkey أثناء المسح (`src/app/api/attendance/scan/route.ts`)، rate limit 12/دقيقة، منع تكرار (`@@unique([lectureId, studentId])` في `Attendance`)، طابور مسح أوفلاين في `localStorage` (`queueOfflineScan` + `PortalAgent`).
- **الدكتور:** Dashboard، إنشاء محاضرة + لوحة QR دوّارة (`/professor/board`)، درجات (quiz/work/midterm 0-60 فقط — `/api/grades` يتجاهل `final`)، مهام، موارد PDF، تقرير حضور CSV.
- **الأدمن:** Stats، CRUD كورسات، منشئ جدول drag-drop، AuditLog feed كامل (كل مسحة/تصدير/تعديل درجة مع IP+UA)، إعدادات (term dates، QR rotation، emergency banner)، نسخ احتياطي Drive.
- **السياسات:** محرك سياسة حضور (`src/lib/attendance-policy.ts`): threshold 75% · maxAbsence 25% · lateCountsAs 0.5 · حالات SAFE/WARNING/DENIED.
- **GPA:** `GpaSnapshot` (terms PREV/T1/T2، مقياس 4.0) + What-If calculator في الواجهة.

### 2.3 الفجوات الموثقة (من `feature-matrix.md` و`project-audit.md`)
- ❌ صفر كود ذكاء اصطناعي (grep: لا Gemini/OpenAI/vector store — `PortalAgent` مجرد toaster).
- ❌ لا كشف شذوذ/وكيل غياب — رغم أن كل الإشارات موجودة (geofence + passkey + audit IP/UA + timestamp).
- ❌ لا at-risk scoring استباقي — الحساب يدوي اليوم عبر AbsenceRadar (عرض فقط).
- 🟡 PWA جزئية: `public/manifest.webmanifest` موجود، **لا يوجد service worker إطلاقاً** (grep: `serviceWorker` → لا نتائج) — لا عمل أوفلاين حقيقي ولا Web Push.
- 🟡 الإشعارات:in-app فقط فعلياً؛ `notifyUsers({email:true})` موجود لكن **لا يوجد digest مجدول** ولا بث إداري حقيقي (قسم الإشعارات في الأدمن "coming soon").
- ❌ لا تحليلات توزيع درجات للدكتور (لا mean/std/histogram؛ `exporters.ts` فيه `toCSV` فقط).
- ❌ لا تسجيل ذاتي للطالب (17 ساعة)، لا Exam Studio، لا gradebook بأوزان/حالات، لا أقسام/sections.
- 🟡 i18n: `src/lib/i18n.tsx` للـLanding فقط — البوابات الثلاث عربية بالكامل، لا نسخة إنجليزية للطلاب الوافدين.
- 🟡 التكلفة غير مرئية: لا لوحة تعرض «ورق وفّرناه، SMS لم ندفعها، تخزين Drive» — رغم أن كل العدادات موجودة في `/api/public/metrics`.

### 2.4 قيود البيئة (تحترم أي تصميم)
- لا migrations — `db push` فقط؛ يجب أخذ backup قبل أي تعديل schema (`scripts/db-backup-drive.mjs`).
- لا Row Level Security حقيقي على مستوى DB (Prisma فقط) → الـauthorization في كود السيرفر (`requireUser` + ownership checks).
- Rate limiting في الذاكرة (10k keys) — لا يصمد لتعدد النسخ؛ يكفي لنطاق قسم واحد.
- النطاق المستهدف: ~7 كورسات · 7 دكاترة · 4 معيدين · ~4 فرق × 180 طالب كحد أقصى (pilot حقيقي).
- **مجاني بالكامل:** لا WhatsApp/SMS مدفوع (وكيل.md Rule 02)، لا بنية تحتية مدفوعة (Rule 14).

---

## 3. مبادئ التصميم للمحفظة

1. **إعادة الاستخدام قبل الإضافة:** ممنوع إضافة حزمة npm أو موديل DB إلا إذا أثبتت فكرة أنه لا بديل. (BRAND.md QA Contract: No new npm packages ما لم يكن ضرورياً).
2. **مجاني أو شبه مجاني:** كل تشغيلة ≤ $0/شهر على الحصص المجانية، مع حد أقصى للإنفاق = 0 إلا بموافقة المالك.
3. **خصوصية أولاً:** لا تُرسل PII (اسم/كود/درجات) لأي API خارجي بدون ضوابط مكتوبة وموافقة. الـAI يعالج نصوص المواد فقط، لا سجلات الطلاب.
4. **الإنسان في الحلقة (HITL):** أي مخرج AI أو scoring = مسودة يقرّها الدكتور/الأدمن، لا قرار تلقائي (Rule 11/09).
5. **قابلية القياس:** كل مبادرة تحمل metric + baseline + target قبل البدء (القسم 9).
6. **صدق البيانات:** كل رقم يظهر في UI يُحسب من DB (كما في `/api/public/metrics`) — ممنوع أرقام تسويقية ملفّقة.

---

## 4. الاثنتا عشرة مبادرة ابتكارية (The 12 Proposals)

> التقدير S = ≤ أسبوع · M = 1–3 أسابيع · L = > 3 أسابيع · الأسعار تشغيلية شهرية على الحصص المجانية.

---

### 💡 1) مساعد رقيب الذكي — Raqib AI Course Assistant (RAG)

- **المشكلة:** الطالب يسأل عن محاضرة البارحة ويُحيله الدكتور لـPDF من 80 صفحة؛ لا توجد إجابة فورية مبنية على مادة الكورس نفسه.
- **الحل:** RAG فوق `Resource` المعتمدة: رفع → استخراج نص → chunks → فهرس → استرجاع مصرّح → إجابة مع **استشهادات إجبارية** ورفض صريح عند نقص المصدر.
- **المستخدم:** الطالب (أساسي) · الدكتور (يراجع/يعتمد المواد) · الأدمن (quota monitoring).
- **Impact:** H · **Effort:** L · **Cost:** free (Gemini Flash-Lite free tier ≈ 1,000–1,500 req/يوم حسب Google — تُراجع حصصها دورياً) · **المخاطر:** تسرّب بيانات خارج المواد (يُعالج: نصوص المواد فقط، zero PII في الـprompt) · هلوسة (استشهادات إجبارية + رفض عند الشك) · استنفاد الحصة (cache + per-user quota + graceful exhaustion).
- **النموذج:** موديل جديد `ResourceChunk { id, resourceId, courseId, ord, text, tokens, createdAt }` (يُضاف عبر `db push` بعد backup) — أو Qdrant خارجي ممنوع (تكلفة/تعقيد)؛ البحث بالكلمة المفتاحية + cosine على embeddings مخزنة كـ`Json`/Bytes في SQLite/Postgres يكفي لـ7 كورسات (مئات الـchunks فقط).
- **المسار في الكود:**
  - `src/lib/ai/provider.ts` — abstraction (`GeminiFlashLiteProvider`) بمفاتيح server-side فقط (`GEMINI_API_KEY` في `.env` — غير موجودة اليوم، تُضاف لـ`.env.example`).
  - `src/lib/ai/rag.ts` — extract (pdf-parse خفيف أو نص خام من `Resource`) → chunk (~500 token، overlap 60) → embed → store.
  - `POST /api/ai/ask` جديد — auth STUDENT، per-user quota (جدول `AppSetting` key `ai_quota_<userId>` أو جدول counters)، تحققات enrollment في الكورس قبل الاسترجاع (لا chunks لكورس غير مسجل فيه).
  - `GET /api/ai/ask` history مجمّع لكل طالب؛ `/student/assistant` صفحة جديدة (Chat UI بـRTL، مبنية على `components/ui/*`).
  - الأدمن: قسم AI quota في `/admin/settings` + عداد في `/api/admin/stats`.
  - **يعتمد على موافقة خصوصية مكتوبة من المالك** (agent.md §AI ARCHITECTURE) قبل أي إرسال لمزود خارجي.
- **مرتبط بـ:** Phase 8 في `implementation-roadmap.md` — نفس المسار، يُسرّع بقرار المنتج.

---

### 💡 2) رادار الخطر المبكر — At-Risk Early-Warning Score (للدكتور)

- **المشكلة:** "الطلاب يتغيبون بصمت" حتى الحرمان (PITCH §1). اليوم AbsenceRadar يعرض الطالب للطالب نفسه فقط؛ الدكتور لا يملك قائمة مرتبة بـ«الأكثر خطراً في مادتي».
- **الحل:** درجة مخاطرة مرجّحة 0–100 لكل (طالب × كورس)، محسوبة server-side من: attendancePct (`attendance-policy.ts`)، اتجاه quiz/work/midterm (`Grade`)، latency تسليم `TaskSubmission` مقابل deadline، انحدار `GpaSnapshot`. **دالة scoring deterministic بحتة — بلا ML
 خارجي، بلا بيانات تغادر السيرفر.**
- **المستخدم:** الدكتور (watchlist أسبوعية) · الأدمن (aggregate حرمان المتوقع على مستوى القسم).
- **Impact:** H · **Effort:** M (أسبوع–أسبوعين) · **Cost:** free (صفر تكلفة — SQL + JS) · **المخاطر:** وصم الطالب (UI: «مؤشر متابعة» لا «تصنيف»، لا يظهر للطالب، لا قرار تلقائي) · إنذارات كاذبة (معايرة thresholds + تأكيد الدكتور) · بيانات ناقصة أول الترم (score معلّق حتى محاضرتين).
- **النموذج:** بدون تغيير schema — كل الأرقام موجودة. (اختياري: جدول `RiskSnapshot` لأرشفة الأسبوعي — `db push` لاحقاً).
- **المسار في الكود:**
  - `src/lib/risk.ts` — `computeRiskScore({attendancePct, quizTrend, submissionLatencyHrs, gpaDelta})` + أوزان من `AppSetting` (`risk_w_attendance`, `risk_w_grade`, `risk_w_task`, `risk_w_gpa`) بحيث يعايرها الأدمن بلا deploy.
  - `GET /api/professor/at-risk?courseId=…` جديد — auth PROFESSOR + course ownership check (نفس نمط `requireUser(['PROFESSOR'])` + فلترة `courseId`).
  - صفحة `/professor/at-risk` (جدول مرتب، فلتر SAFE/WATCH/CRITICAL، زر «أرسلي تنبيه» → `notifyUsers`).
  - `src/app/api/admin/stats/route.ts` — عداد «طلاب تحت حد الحرمان» في الـdashboard.
  - اختبارات: `tests/risk.spec.ts` (vitest) للأوزان والحواف (طالب جديد بلا درجات → null لا zero).
- **مرتبط بـ:** يعزز Phase 7 (reports) — نفس مصدر البيانات.

---

### 💡 3) رادار رقيب الحصيف — Raqib Sentinel: كشف وكيل الغياب والشذوذ

- **المشكلة:** QR دوّار يمنع نسخ الرمز نظرياً، لكن: طالب يرسل رمز هاتفه لزميل في السكن (buddy proxy)، أو يمسح من خارج القاعة بإنترنت ضعيف ثم يُعدّل GPS، أو 10 طلاب يمسحون في نفس الثانية من نفس الجهاز. **المنصة لا ترى أي من هذا اليوم** رغم أن الإشارات موجودة في الكود.
- **الحل:** طبقة إشارات + محرك قواعد + **صندوق مراجعة للدكتور** (لا عقوبة تلقائية — Rule 09/11):
  - إشارات عند كل مسح: IP hash، User-Agent hash، device fingerprint hash (Canvas/UA/timezone/locale — خفيف، بلا SDK)، GPS accuracy، اتجاه الوقت داخل النافذة (أول/آخر 10 ث؟)، passkey counter delta.
  - قواعد R1–R8 (أمثلة): R1 جهاز واحد ↔ ≥3 students خلال 10 دقائق · R2 IP مشترك ≥3 طلاب · R3 دقة GPS >100m باستمرار · R4 المسح دائماً في آخر ثانيتين من النافذة + نفس الإحداثي التقريبي · R5 passkey counter لا يتزايد (استنساخ استجابة) · R6 مستبعد جغرافياً متكرر (≥30م عن geofence لكن accuracy سيئة دائماً بشكل منتظم) · R7 نمط «موجود دائماً – درجات صفر» · R8 تسجيلات دفعة واحدة من محاضرة واحدة بكثافة غير طبيعية.
  - Score شذوذ 0–100؛ ≥70 → بطاقة في `/professor/attendance/anomalies`؛ الدكتور يؤكد/يستبعد مع سبب إلزامي → `AuditLog` + `notifyUsers` عند التأكيد.
- **المستخدم:** الدكتور (محقق) · الأدمن (نظرة قسمية) · الطالب (يُبلَّغ فقط بعد قرار دكتور — شفافية).
- **Impact:** H · **Effort:** L (3–4 أسابيع) · **Cost:** free (حساب داخلي؛ لا APIs خارجية) · **المخاطر:** إيجابيات كاذبة (بطارية: accuracy سيئ للجميع في مبنى خرساني → معايرة R3/R6 بعتبة adaptative per-lecture من median accuracy) · خصخصة (hashes فقط، لا fingerprints خام؛ الاحتفاظ 90 يوماً ثم purge — سياسة مكتوبة) · إرهاق الدكتور (أعلى 20 بطاقة/أسبوع فقط، مرتبة بالدقة).
- **النموذج:** جدول جديد `AttendanceSignal { id, attendanceId UNIQUE, lectureId, studentId, ipHash, uaHash, deviceFpHash, geoAccuracyM, counterDelta, at }` + index(lectureId, at). يُدفع عبر `db push` بعد backup (المستودع بلا migrations — خطر موثق في project-audit §7).
- **المسار في الكود:**
  - تعديل `src/app/api/attendance/scan/route.ts` — بعد نجاح `recordAttendance`، كتابة إشارات (لا تُفشل المسح إن فشلت كتابة الإشارة — `try/catch` + audit).
  - `src/lib/anomaly.ts` — `scoreLectureSignals(lectureId)` يعمل كـjob: `scripts/anomaly-scan.mjs` (nightly / عند إغلاق المحاضرة) + زر «فحص الآن» في لوحة الدكتور.
  - `GET/POST /api/professor/attendance/anomalies` جديد (+`/api/admin/attendance/anomalies` aggregate).
  - صفحة `/professor/attendance/anomalies/page.tsx` — بطاقات: القاعدة المُفعَّلة، الدليل (ips/counts مُقنَّعة)، أزرار تأكيد/استبعاد + سبب.
  - إعادة استخدام `AuditLog` (موجود) لكل قرار.
  - اختبارات: `tests/anomaly.spec.ts` — كل قاعدة R1–R8 على fixtures؛ E2E: رحلة دكتور يفتح صندوق الشذوذ.
- **مرتبط بـ:** الرهان الرئيسي — انظر القسم 7.

---

### 💡 4) رقيب أوف لاين — Offline-First PWA (Service Worker + شبكة ضعيفة)

- **المشكلة:** WiFi قاعات كلية العلوم ضعيف/مزدحم وقت المحاضرات؛ `manifest.webmanifest` موجود لكن **لا يوجد service worker** → فتح المنصة بلا إنترنت = شاشة بيضاء؛ طابور المسح موجود لكن بقية البوابة لا تعمل أوفلاين.
- **الحل:** SW يدوي خفيف (بلا `next-pwa` — لا حزم جديدة): precache لـshell + runtime caching (NetworkFirst للـAPI مع timeout 4s → cache fallback؛ CacheFirst للأصول الثابتة)؛ IndexedDB/localStorage لآخر timetable/tasks/grades؛ Background Sync لطابور المسح الموجود (`queueOfflineScan` في BRAND.md #15)؛ Web Push (VAPID مجاني) لتذكيرات المحاضرة.
- **المستخدم:** الطالب (أساسي) · الدكتور (لوحة QR تعمل أوفلاين — critical!) · الأدمن (status page يحترم offline).
- **Impact:** H · **Effort:** M · **Cost:** free (VAPID keys مجانية، hosting نفسه) · **المخاطر:** تخزين stale لبيانات مالية/درجات (لا caching لـ`/api/grades` — NetworkOnly مدروسة) · تعقيد تحديث SW (version hash + auto-skipWaiting banner) · اختلاف المتصفحات (Safari iOS: Web Push فقط من iOS 16.4+ على PWA مثبتة).
- **النموذج:** بدون تغيير schema.
- **المسار في الكود:**
  - `public/sw.js` جديد + `src/components/shared/ServiceWorkerRegistrar.tsx` يُضاف لـ`StudentShell`/`DashboardShell`/`ProfessorShell` (أو layout الجذر) — تسجيل عبر `navigator.serviceWorker.register('/sw.js')` مع update prompt.
  - `public/manifest.webmanifest` — يُحدَّث (theme_color يطابق الهوية، shortcuts حقيقية: `/student` بدل `/login` بعد الدخول).
  - `src/lib/push.ts` — VAPID keys (`npx web-push generate-vapid-keys` مرة واحدة، تخزن في env)؛ جدول `PushSubscription` جديد (`db push`) أو تخزين على `Session`-نمط؛ `POST /api/push/subscribe` + `POST /api/push/send` (للأدمن/النظام) عبر fetch إلى webpush protocol بدون حزمة (أو حزمة `web-push` — صغيرة، مقبولة).
  - تعديل `src/lib/notify.ts` — قناة push اختيارية بجوار in-app/email.
  - CSP في `middleware.ts` — إضافة `connect-src` لـpush endpoint (`fcm.googleapis.com` لـVAPID).
  - اختبارات: Playwright offline journey (`context.setOffline(true)` → الجدول يظهر من cache).
- **مرتبط بـ:** Phase 9 (PWA performance) — يسبقها لأنه يزيل أكبر نقطة ألم يومية.

---

### 💡 5) نبضة رقيب الأسبوعية — Progress Digest (طالب + ولي الأمر، بلا WhatsApp)

- **المشكلة:** agent.md يمنع WhatsApp/SMS المدفوع (Rule 02)، لكن «أولياء الأمور لا يعرفون شيء حتى الحرمان». `notifyUsers({email:true})` موجود وغير مستغل؛ Resend المجاني ≈100 بريد/يوم يكفي تماماً لـ180 طالب أسبوعياً + أولياء opt-in.
- **الحل:** Digest أسبوعي (السبت 06:00) يولَّد server-side: لكل طالب — حضوره بالمادة، مهامه المنجزة/المتأخرة، درجته الأخيرة المنشورة، تنبيه الحرمان إن وجد — بصيغة HTML RTL بهوية الكلية (يعيد استخدام `noticeEmailHtml` كنمط). Opt-in لولي الأمر عبر `User.email` ثانوي أو جدول `GuardianLink` (later)؛ في MVP: بريد الطالب نفسه + نسخة اختيارية لبريد يُضافه بنفسه في `/student/profile`.
- **المستخدم:** الطالب · ولي الأمر (opt-in) · الدكتور (لا يرى شيئًا — خصوصية) · الأدمن (queue حالات + unsubscribe).
- **Impact:** M/H · **Effort:** S–M · **Cost:** free (Resend free tier؛ 0.5 GB Neon يكفي) · **المخاطر:** إزعاج/spam (unsubscribe link واحد-click + حد أسبوعي إلزامي) · بريد ولي الأمر خاطئ (الطالب هو من يضيفه — مسؤوليته) · Resend يسقط (طابور retry + graceful skip، كما في `notify.ts` الحالي) · PII بالبريد (محتوى ملخص بلا كود وطني/درجات خام لولي الأمر بدون موافقة الطالب — MVP: بريد الطالب فقط).
- **النموذج:** بدون تغيير schema للـMVP (بريد الطالب + رابط إلغاء اشتراك موقّت في نفس الـemail via HMAC token — نمط `qr-sign.ts`). `GuardianLink` مؤجل.
- **المسار في الكود:**
  - `src/lib/digest.ts` — بناء digest لكل طالب (نفس استعلام `/api/attendance/summary` + مهام + grades منشورة فقط).
  - `scripts/weekly-digest.mjs` — يرسل دفعة واحدة (loop على الطلاب النشطين)، dry-run flag، يقرأ `RESEND_API_KEY`؛ يُجدول على Windows Task Scheduler / cron للسيرفر، **أو** Vercel Cron (Hobby: cron يومياً مجاني — نضعه يومين بالأسبوع فقط إن احتجنا).
  - `POST /api/admin/digest/send?test=1` — أدمن يطلب عينة لنفسه (اختبار قبل الإطلاق).
  - `/student/profile` — زر «أرسل نسخة لولي الأمر» + حقل بريد + حفظ في `User.guardianEmail` (عمود جديد nullable — `db push`).
  - `GET /api/digest/unsubscribe?token=…` — HMAC-verified unsubscribe.
- **مرتبط بـ:** Phase 7 (reports & notifications) — نسخة push بدل in-app فقط.

---

### 💡 6) عدسة الدكتور — Grade Distribution Analytics (تحليلات توزيع الدرجات)

- **المشكلة:** الدكتور يدخل درجات quiz/work/midterm يدوياً بلا أي صورة عن التوزيع؛ لا يعرف إن كان الامتحان متطرف السهولة/الصعوبة، ولا إن كان طالب يتهاوى فجأة — Accreditation committees تطلب هذه الجداول.
- **الحل:** لوحة تحليلات لكل (كورس × مكوّن درجة): histogram (عشر فئات)، mean/median/std/min/max، مقارنة بين الفرق، قائمة outliers (±2σ)، اتجاه ترم-بترم عبر `GpaSnapshot`، تصدير CSV عبر `exporters.ts` `toCSV` + طباعة.
- **المستخدم:** الدكتور (أساسي) · رئيس القسم/الأدمن (audit + accreditation packs).
- **Impact:** M/H · **Effort:** S · **Cost:** free · **المخاطر:** تفسير إحصائي خاطئ (tooltips تعليمية بالعربية + لا أحكام "جيد/سيئ" تلقائية) · دقة n صغيرة (إخفاء المؤشرات عند n<10 — «بيانات غير كافية»).
- **النموذج:** بدون تغيير schema — كل البيانات في `Grade` + `Enrollment` + `ScheduleSlot.group`.
- **المسار في الكود:**
  - `GET /api/professor/grades/analytics?courseId=…` جديد — PROFESSOR + ownership؛ يحسب في JS من `prisma.grade.findMany({ where: { courseId } })` (حجم: ≤300 طالب — لا مشكلة أداء).
  - `src/components/professor/GradeHistogram.tsx` — SVG يدوي بنفس أسلوب `MiniCharts.tsx` (لا مكتبة جديدة — قرار معماري قائم).
  - تبويب ثالث في `/professor/grades/page.tsx`: «التوزيع». زر «تصدير CSV» يستدعي `toCSV` الموجود.
  - `src/app/admin/reports/page.tsx` — قسم «توزيع الدرجات على مستوى القسم» (تجميع aggregate فقط، بلا أسماء).
  - اختبارات: `tests/grades-analytics.spec.ts` (mean/std/histogram على fixtures).
- **مرتبط بـ:** يعزز Phase 6 (gradebook) و Phase 7 (reports).

---

### 💡 7) سلسلة رقيب — Gamified Attendance Streaks & Badges

- **المشكلة:** الحضور اليوم checkbox سلبي؛ لا دافعية داخلية؛ الطلبة يحتاجون "سلسلة" تُرى وتُحافَظ عليها (نفس سيكولوجية Duolingo، لكن بضوابط الجامعة — لا بيع، لا خصم).
- **الحل:** سلسلة أيام حضور لكل طالب (موجودة ضمنياً في `Attendance` — تُشتق، لا تُخزَّن)، شارات محلية (محلياً عبر `localStorage` + عرض في الـdashboard): «حاضر 5/5»، «أسبوع مثالي»، «عودة بعد غياب»، «حضور مثالي أول الترم». الاحتفال يعيد استخدام `canvas-confetti` + `celebrate.ts` الموجود. لا لوائح شرف اسمية علنية — **شارات شخصية فقط** (خصوصية الطلاب).
- **المستخدم:** الطالب.
- **Impact:** M · **Effort:** S · **Cost:** free · **المخاطر:** تحفيز حضور زائف («أنا موجود لكن نائم») — يُقاس كمّياً لا يُعتد به كمعيار؛ إدمان/ضغط (opt-out في `portal-prefs`) · تزييف بالمشاركة (شارات مشتقة من `Attendance` فقط — مصدر واحد للحقيقة).
- **النموذج:** بدون تغيير schema (اشتقاق كامل من `Attendance`/`Lecture`).
- **المسار في الكود:**
  - `src/lib/streaks.ts` — `computeStreak(records): { current, best, badges: Badge[] }`؛ يُستدعى من `/api/attendance/summary` (حقل `streak` يُضاف للرد — تغيير backward-compatible).
  - `src/components/student/StreakCard.tsx` — حلقة تقدّم (GradientRing موجود) + الشارات + زر confetti عند كسر الرقم القياسي.
  - صفحة `/student/lectures` — عمود «سلسلتك».
  - إعدادات الطالب `portal-prefs.ts` — مفتاح `streaksEnabled`.
- **مرتبط بـ:** يعزز WP "StudyPlanner streak" الموجود في BRAND.md #17 — نفس النمط.

---

### 💡 8) مسوّدة رقيب — AI Quiz Draft Generator (من مواد المحاضرة، HITL)

- **المشكلة:** الدكتور يريد 20 سؤال اختيار من متعدد من PDF المحاضرة — شغل 45 دقيقة ممل؛ يريدها **مسودة يقرّها** لا امتحاناً حياً.
- **الحل:** زر في `/professor/resources` (أو جديد `/professor/ai`): «ولّد مسوّدة أسئلة» → يأخذ نص Resource معتمد، يرسله لـFlash-Lite (لا PII)، يطلب JSON صارم `{questions: [{stem, options[4], answerIndex, bloom}]}` → **يخزَّن كمسوّدة** `QuizDraft` لا كسؤال حي → الدكتور يحرر/يحذف/يعتمد → عند الاعتماد يمكن تحويلها لاحقاً لسؤال Exam Studio (Phase 5) أو لملف PDF للمراجعة.
- **المستخدم:** الدكتور · (الطالب لاحقاً كـ«تدرّب» على material approved).
- **Impact:** M · **Effort:** M · **Cost:** free (Flash-Lite free tier؛ طلب واحد لكل 50 صفحة) · **المخاطر:** أسئلة خاطئة علمياً (HITL إلزامي — لا تُنشر بدون مراجعة؛ "AI suggestion" label واضح — Rule 11) · تسريب (المواد فقط) · جودة عربية (prompt؟ بالعربية الفصحى + مراجعة دكتور؛ الأداء على رياضيات/CS مقبول).
- **النموذج:** `QuizDraft { id, resourceId, courseId, createdById, payload Json, status DRAFT|APPROVED|DISCARDED, createdAt }` — `db push`.
- **المسار في الكود:**
  - `src/lib/ai/provider.ts` (مشترك مع #1) + `src/lib/ai/quiz-draft.ts`.
  - `POST /api/professor/ai/quiz-draft` — PROFESSOR + course ownership؛ rate limit 5/ساعة/دكتور؛ يرفض >8 آلاف token إدخال.
  - صفحة `/professor/ai/quiz-draft/page.tsx` — اختيار Resource + عدد الأسئلة + نوع (MCQ/TF) → عرض المسوّدة في بطاقات قابلة للتعديل (inline edit) → اعتماد/حذف.
  - «اعتماد» يكتب `AuditLog` (AI_QUIZ_DRAFT_APPROVED) — شفافية كاملة.
- **مرتبط بـ:** يثبّت أساس Exam Studio (Phase 5) دون كتابة سطر منه.

---

### 💡 9) مقياس رقيب — Exam Seat Randomizer + Seating Chart

- **المشكلة:** لجان الامتحان تحدد الجلوس يدوياً؛ الغش المنظم سهل مع "جلوس الأصدقاء بجانب بعض"؛ طباعة قوائم الجلوس تستهلك وقت معيد.
- **الحل:** زر «ولّد مقاعد» لكل (كورس × امتحان): shuffle seeded (Fisher–Yates + seed قابل للطباعة لإعادة الإنتاج) يوزع المسجلين على مقاعد قاعة (شبكة أ×ب قابلة للضبط)؛ يمنع تجاور نفس الجروب/الكود (قيد اختياري)؛ يطبع seating chart بهوية الكلية (CSS print موجود نمط `/print-area`)؛ قائمة استدعاء بالأسماء + QR تحقق حضور يوم الامتحان (يعيد استخدام مسار المسح الموجود!).
- **المستخدم:** الدكتور/المعيد (يولّد) · الأدمن (قاعات) · الطالب (يرى مقعده فقط **في يوم الامتحان** — لا قبله).
- **Impact:** M · **Effort:** S · **Cost:** free · **المخاطر:** طالب يحتاج جلوس خاص (حالات استثنائية: checkbox «مقاعد استثنائية» تُستبعد من الخلط وتتوضع يدوياً — إلزامي) · عشوائية غير عادلة بصرياً (shuffle seeded يُطبع على اللجنة — قابلية المراجعة) · تسريب المخطط قبل الامتحان (يظهر فقط في نافذة زمنية يقررها الدكتور — `releaseAt`).
- **النموذج:** `ExamSeating { id, courseId, examId?, seed Int, gridJson Json, assignmentsJson Json, releaseAt DateTime?, createdById, createdAt }` — `db push`. (بديل MVP بلا schema: `AppSetting` key `seating_<courseId>` — لكن موديل أنظف.)
- **المسار في الكود:**
  - `src/lib/seating.ts` — seeded RNG (mulberry32) + Fisher–Yates + قيود تجاور الجروب.
  - `POST /api/professor/seating/generate` ، `GET /api/professor/seating/[id]` ، `GET /api/student/seating/current` (يُرجع مقعده فقط بعد releaseAt).
  - صفحة `/professor/exam/seating/page.tsx` + طباعة عبر نفس نمط `@media print` في BRAND.md #11 (`/student/report` print-area).
  - CSV export للجنة عبر `toCSV`.
- **مرتبط بـ:** يكمل Exam Studio (Phase 5) — يعمل اليوم بلا Exam Studio عبر `examName` نصي حر.

---

### 💡 10) رقيب يتكلم — Voice Attendance & Accessibility Pass

- **المشكلة:** طالب بإعاقة بصرية أو رعشة يد يحتاج يمسح QR — أصلاً صعب؛ الدخول بالكود اليدوي 6 أرقام أسهل لكن ما زال يحتاج يد دقيقه. المنصة تدّعي الوصولية لكن الصوت غير مستغل إطلاقاً.
- **الحل:** (أ) **Voice Check-in**: زر 🎤 في شاشة المسح يستدعي Web Speech API (`SpeechRecognition`، ar-EG/ar + fallback en) — الطالب يقول «رقم واحد اثنين ثلاثة…» أو يقرأ الكود الظاهر للكاميرا — يُحوَّل لأرقام عربية/هندية ويمر بنفس مسار MANUAL code الموجود (`isManualCode`) — صفر backend جديد. (ب) **A11y Pass** شامل: skip-link، focus-visible rings (موجودة جزئياً)، `aria-live="polite"` لتأكيد الحضور، تباين WCAG AA على كل الأزرار الذهبية، قارئ الشاشة للويدجتس الـ15، وضع "خط كبير" موجود لكنه يُوسَّع للجداول.
- **المستخدم:** طالب ذو إعاقة بصرية/حركية · أي طالب (hands-free) · الجميع (a11y).
- **Impact:** M · **Effort:** S–M · **Cost:** free (browser-native API، لا سرفر STT) · **المخاطر:** لهجات/ضوضاء قاعة (تأكيد مرئي إلزامي قبل الإرسال — «سمعنا: 482913 — صح؟») · خصوصية صوتية (معالجة محلية في المتصفح — لا صوت يغادر الجهاز — Web Speech قد يستخدم سرفر Google في Chrome! يُوثَّق: opt-in صريح + بديل الكتابة دائماً) · متصفحات لا تدعمه (Safari iOS partial → fallback لوحة مفاتيح بخط 48px).
- **النموذج:** بدون تغيير schema.
- **المسار في الكود:**
  - `src/components/student/VoiceCheckIn.tsx` (جديد) — يغلف زر في `/student/attendance` (الصفحة موجودة في `src/app/student/attendance`) + يستدعي نفس endpoint `/api/attendance/scan` مع `token=MANUAL_CODE`.
  - `src/lib/speech.ts` — normalizer للأرقام العربية/الإنجليزية (٠-٩ ↔ 0-9) + timeout + retry.
  - مراجعة `globals.css` لـ`@media (prefers-contrast: more)` و`portal-hc` (موجود في BRAND.md #25 — يُعمَّم على كل البوابات).
  - axe-core في vitest (`@axe-core/react` — dev-only) على صفحات المسح.
- **مرتبط بـ:** Phase 2 (design system a11y) — يُنفَّذ قبله أو خلاله.

---

### 💡 11) عداد الاستدامة والتكلفة — Sustainability & Cost Dashboard (للأدمن)

- **المشكلة:** الكلية تسأل «ما عائد الرقمنة؟» — المنصة تمنع 840 ورقة حضور/مادة/ترم (PITCH §4) وSMS مكلفة — لكن **لا توجد لوحة تُظهر هذا الرقم**. القرارات الإدارية تُبنى على انطباعات.
- **الحل:** قسم جديد في `/admin/reports` أو `/admin/settings` → «لوحة الأثر»: أوراق حُفظت (عدد سجلات حضور × ورقتان/كشف × 7 مواد × 180 طالب)، أكواد SMS لم تُرسل (× ~0.15 ج.م)، kg CO₂ مكافئ (pel incar paper ~5g/sheet — قيمة تقريبية موقّتة)، استخدام Drive/DB (موجود جزئياً في `/api/admin/system`)، **عداد التكلفة التشغيلية = $0.00** مقابل كلفة بديلة تقديرية (ورق+طباعة+أكواد = ~X ألف ج.م/سنة) + كل العدادات **محسوبة من DB حية** (لا أرقام تسويقية — Rule/صدق البيانات).
- **المستخدم:** الأدمن · رئيس القسم (للعروض) · الكلية (اعتمادات).
- **Impact:** M (عالي للعروض والتمويل) · **Effort:** S · **Cost:** free · **المخاطر:** أرقام مضخمة (كل معادلة معلنة على اللوحة بحواشيها — «تقريبي»، مصادرها) · مقارنة ورقية غير دقيقة (نستخدم متوسط A4 5g + طباعة 0.05 ج.م/ورقة موثق كافتراضات قابلة للتعديل من `AppSetting`).
- **النموذج:** بدون تغيير schema — استعلامات على `Attendance`/`Task`/`Resource`/`AuditLog`.
- **المسار في الكود:**
  - `GET /api/admin/impact` جديد — يحسب: sheetsSaved = attendances; paperKg = sheets×0.005; smsAvoided = notifications(email→sms-equivalent)؛ costAvoidedEgp = …؛ rowsInDb؛ driveUsage (من `/api/admin/system` الموجود — يعيد استخدام `drive.ts`).
  - صفحة `/admin/impact/page.tsx` — كروت + حواشي المعادلات + زر «طباعة تقرير الأثر» (`print-area`).
  - `/api/public/metrics` — لا يتغير؛ اللوحة للأدمن فقط.
- **مرتبط بـ:** Phase 7 (reports) · Pitch/marketing للكلية.

---

### 💡 12) مُحسِّن الجدول — Schedule Auto-Optimizer (اقتراح لاطي)

- **المشكلة:** بناء جدول القسم (7 مواد × فرق × 4 فترات × أيام) يدوياً عبر drag-drop بطيء؛ تضارب غير مرئي بين فرقة وشعبة؛ قاعات `isVip` تُحجز بلا سبب.
- **الحل:** أداة **اقتراح** (لا كتابة تلقائية): constraint solver بسيط (backtracking مع حد زمني 5 ثوانٍ) يأخذ: الشعب (A/B)، المواد الـ7 مع الساعات، تفضيلات الدكاترة (صباح/مسائي — `AppSetting`)، قيود القاعات → يخرج 3 بدائل مرتبة بأقل تضاربات → الأدمن يختار «اعتماد بديل» يُطبَّق كـ`ScheduleSlot` بمعاملة واحدة (tx) + `AuditLog` — أو يأخذ المقترح كمسودة ويكمل يدوياً في المنشئ الحالي.
- **المستخدم:** الأدمن (build once/ترم) · رئيس القسم.
- **Impact:** M · **Effort:** L · **Cost:** free (لا مكتبات — backtracking يدوي لـ7 مواد×2 فرق×28 خانة = فضاء صغير) · **المخاطر:** جدول "مثالي" نظرياً وكارثي عملياً (دائماً draft — الأدمن يقرر؛ عرض الفروق بصرياً) · قيود ناقصة (نقص بيانات تفضيل → مخرجات عشوائية؛ تُجمع 3 أسئلة تفضيل قبل التوليد) · وقت تشغيل (cap 5s + best-effort result مع تقرير التضاربات المتبقية).
- **النموذج:** بدون تغيير schema للـMVP — يقرأ/يكتب `ScheduleSlot` الموجود + جدول جديد اختياري `ScheduleDraft { id, label, slotsJson Json, createdById, createdAt }` (`db push`).
- **المسار في الكود:**
  - `src/lib/schedule-optimizer.ts` — pure function: `optimize(input): ScheduleDraft[]` — قابلة للاختبار 100% في vitest (deterministic seed).
  - `POST /api/admin/schedule/optimize` — ADMIN فقط؛ body: تفضيلات؛ يرجع بدائل (لا كتابة).
  - `POST /api/admin/schedule/optimize/apply` — tx: يمسح T-slots الterm المسودة ويكتب البديل؛ `AuditLog(SCHEDULE_OPTIMIZED)`.
  - زر "🪄 اقترح بديلاً" في `/admin/schedule/page.tsx` (المنشئ موجود — نضيف زر + مودال معاينة).
- **مرتبط بـ:** Phase 3/4 (schedule) — لا يعتمد عليها؛ يعمل اليوم.

---

### 📊 جدول مقارنة المحفظة (Portfolio Comparison)

| # | المبادرة | المستخدم | Impact | Effort | Cost | يعتمد على |
|---|----------|----------|--------|--------|------|-----------|
| 1 | مساعد رقيب الذكي (RAG) | طالب | H | L | free | موافقة خصوصية + Phase 8 |
| 2 | رادار الخطر المبكر | دكتور/أدمن | H | M | free | لا شيء (SQL موجود) |
| 3 | **رادع وكيل الغياب (Sentinel)** | دكتور/أدمن | **H** | **L** | **free** | backup + `db push` |
| 4 | رقيب أوف لاين (PWA + SW) | طالب/دكتور | H | M | free | لا شيء |
| 5 | نبضة رقيب الأسبوعية (Digest) | طالب/ولي أمر | M/H | S–M | free | Resend key |
| 6 | عدسة الدكتور (Grade Analytics) | دكتور/أدمن | M/H | S | free | لا شيء |
| 7 | سلسلة رقيب (Streaks) | طالب | M | S | free | لا شيء |
| 8 | مسوّدة رقيب (AI Quiz Draft) | دكتور | M | M | free | #1 infrastructure |
| 9 | مقياس رقيب (Seat Randomizer) | دكتور/أدمن | M | S | free | لا شيء |
| 10 | رقيب يتكلم (Voice/A11y) | طالب (a11y) | M | S–M | free | لا شيء |
| 11 | لوحة الأثر (Sustainability/Cost) | أدمن/كلية | M | S | free | لا شيء |
| 12 | مُحسِّن الجدول (Auto-Optimizer) | أدمن | M | L | free | لا شيء |

**ما استبعدناه عمداً (ولماذا):** تطبيق موبايل native (PWA تكفي — Rule: no unnecessary infra)؛ تكامل شؤون الطلاب (يحتاج اتفاق رسمي — Pitch الشهر 3)؛ WhatsApp/SMS المدفوع (Rule 02)؛ دفع داخل المنصة (لا داعي)؛ Blockchain للشهادات (overkill لقسم واحد)؛ LLM محلي (خادم GPU — تكلفة وتعقيد) · لوائح الشرف العامة (خصوصية) · proctored exams بصوت/كاميرا (خصوصية + iOS restrictions).

---

## 5. التوصية: ثلاث فوزات سريعة (TOP 3) + رهان رئيسي واحد (FLAGSHIP)

**Quick Wins (≤ أسبوعين لكل واحد، متوازية بلا تداخل ملفات):**
- **QW1 — رادار الخطر المبكر** (#2) — أعلى أثر/أجهد نسبة في المحفظة؛ صفر تكلفة.
- **QW2 — عدسة الدكتور: تحليلات توزيع الدرجات** (#6) — أسبوع واحد؛ يطلبها الاعتماد فوراً.
- **QW3 — رقيب أوف لاين: Service Worker + PWA كاملة** (#4) — أسبوعان؛ يزيل أكبر شكوى يومية (WiFi ضعيف).

**Flagship Bet (الرهان الرئيسي — 4–6 أسابيع):**
- **FL — رادع رقيب الحصيف (Raqib Sentinel):** طبقة إشارات مسح + محرك قواعد + صندوق مراجعة دكتور، تحوّل المنصة من «تسجيل حضور» إلى **«الثقة بالغياب»** — وهي الهوية نفسها (رَقيب = مَن يرى).

(لماذا ليس RAG كـflagship؟ — لأنه يحتاج موافقة خصوصية خارجية + quota خارجية متقلبة؛ Sentinel يعتمد كلياً على كودنا وبياناتنا، ويحمي نواة القيمة: الحضور. RAG يأتي كمشروع flagship التالي في الربع الثاني — القسم 8.)

---

## 6. الخطط التنفيذية التفصيلية للفوزات السريعة الثلاث

#### 🥇 QW1 — رادار الخطر المبكر (At-Risk Early-Warning) · أسبوع–أسبوعان

**الهدف:** دكتور مادة كذا يرى خلال <10 ثوانٍ: «من طلابي الـ180 يحتاج تدخل هذا الأسبوع؟» مرتبة بدرجة خطر، وسبب كل درجة معلن.

**الأسبوع 1 — النواة الحسابية + API:**
1. `src/lib/risk.ts` جديد — `computeRiskScore()`:
   - inputs لكل طالب في كورس X: `attendancePct` (من نفس منطق `computeStudentCourseStats` في `attendance-policy.ts` — إعادة استخدام مباشرة)، `gradeSlope` (quiz→work→midterm trend — انحدار linefit بسيط)، `avgSubmissionDelayHrs` (من `Task.deadline` − `TaskSubmission.submittedAt`، المهام المتأخرة تُحسب)، `gpaDelta` (آخر `GpaSnapshot` − سابقه، اختياري).
   - أوزان من `AppSetting` (`risk_w_att`=50, `risk_w_grade`=25, `risk_w_task`=15, `risk_w_gpa`=10 — افتراضي) — الأدمن يعاير بلا deploy.
   - مخرج: `{ score 0–100, band: OK|WATCH|CRITICAL, reasons: string[] }` — `reasons` نص عربي مفسر: «غاب 3 من آخر 5 محاضرات»، «درجتا quiz متراجعتان».
   - **طالب جديد** (محاضرات < 2): `score: null, band: 'INSUFFICIENT_DATA'` — لا تُظلم أحداً.
2. `GET /api/professor/at-risk?courseId=…` جديد في `src/app/api/professor/at-risk/route.ts` — `requireUser(['PROFESSOR'])` + تحقق ملكية الكورس (نفس نمط موجود في `src/app/api/professor/*`)، يرجع مصفوفة مرتبة.
3. `tests/risk.spec.ts` — 4 حالات: طالب خطر حقيقي / طالب ممتاز / بيانات ناقصة / أوزان معدّلة.

**الأسبوع 2 — الواجهة + الإشعار:**
4. صفحة `/professor/at-risk/page.tsx` — جدول: الطالب (اسم + كود)، score badge ملون، reasons (chips)، زر «إرسال متابعة» → modal نص قصير → `notifyUsers({ userIds, kind:'ALERT' })` (موجود).
5. Tabs في `/professor/grades`؟ لا — صفحة مستقلة + رابط في Sidebar الدكتور (`src/components/professor/` — انظر أين تُعرّف روابط السايدبار؛ تُضاف نفس النمط).
6. الأدمن: بطاقة في `/admin/reports` — «طلاب حرموا/تحت الخطر متوقعون: N» (aggregate COUNT بدون أسماء — خصوصية).
7. تحديث docs: `feature-matrix.md` (🟡→✅ بعد QA)، `implementation-roadmap.md` سطر في Phase 7.

**ملفات تلمسها:** 1 ملف lib + 1 route جديد + 1 صفحة + 1 sidebar link + 1 test + docs. **لا schema change. لا حزم جديدة.**
**التحقق:** `tsc --noEmit` · `vitest run tests/risk.spec.ts` · دخول دكتور تجريبي → القائمة تُحمّل < 1s على 300 صف.
**Kill criteria:** لو تبين أن `TaskSubmission` فارغة لغالبية الكورسات (لم تُستخدم المهام) → نُسقط `risk_w_task` من 50 للأوزان الافتراضية ونوثّق.

---

#### 🥈 QW2 — عدسة الدكتور: Grade Distribution Analytics · أسبوع واحد

**اليوم 1–2 — API:**
1. `GET /api/professor/grades/analytics?courseId=…` في `src/app/api/professor/grades/analytics/route.ts` — auth PROFESSOR + ownership؛ للكل (quiz/work/midterm/final) يحسب: count, mean, median, populationStd, min, max، histogramعشر فئات (0-10..90-100)، n<10 → `{insufficient: true}`.
2. مقارنة الفرق A/B/C إن وُجدت في `ScheduleSlot.group` (join عبر Enrollment؟ لا — `User.group` الموجود على الطالب) — متوسط لكل جروب.
3. `tests/grades-analytics.spec.ts` — fixtures معروفة القيم.

**اليوم 3–4 — الواجهة:**
4. `src/components/professor/GradeHistogram.tsx` — SVG يدوي (نفس نمط MiniCharts: لا recharts في المشروع — قرار قائم). Gradient bars + tooltip عند hover (score range + count) + خط mean.
5. تبويب «التوزيع» داخل `src/app/professor/grades/page.tsx` (الصفحة موجودة — نضيف Tab ثالث بجوار المصفوفة الحالية بدون كسر التبويبين الحاليين).
6. أزرار: «تصدير CSV» (`toCSV` من `exporters.ts` + BOM — موجود) · «طباعة» (CSS print الموجود).
7. قسم أدمن في `/admin/reports` — جدول aggregate: لكل كورس — mean/median/std/flag (`std > 25` → «توزيع واسع» بأيقونة ⚠ بدون أحكام).

**اليوم 5 — QA + docs:**
8. `tsc` · `vitest` · بناء `.next-prod` · فحص يدوي بحساب دكتور تجريبي.
9. توثيق في `feature-matrix.md` (grading 🟡→🟡+) و`implementation-roadmap.md`.

**ملفات تلمسها:** 2 route جديد + 1 component + تعديل صفحة grades + reports admin + test + docs. **لا schema change.**
**Kill criteria:** لو توزيع final غير قابل للحساب (final لا يُدخَّل — مشروع audit معروف!) → نطلق على quiz/work/midterm فقط ونوثّق الفجوة مع Phase 6.

---

#### 🥉 QW3 — رقيب أوف لاين: Service Worker + PWA كاملة · أسبوعان

**الأسبوع 1 — SW + التسجيل:**
1. `public/sw.js` — vanilla JS (~150 سطر): versioned cache `raqib-v<hash>`؛ precache = `/`, `/icon.svg`, `/manifest.webmanifest`, أصناف `/_next/static` عند runtime (CacheFirst للمأصول غير المتغيرة)؛ `NetworkFirst` timeout 4s لـ`/api/student/dashboard`, `/api/schedule`, `/api/tasks` (آخر نسخة)؛ `NetworkOnly` لكل ما هو grades/auth/admin (لا أسرار في cache)؛ offline fallback page `/offline.html` (static RTL بشعار الكلية + زر «حاول مجدداً» + يعرض طابور المسح المحفوظ!).
2. `src/components/shared/ServiceWorkerRegistrar.tsx` — `'use client'`؛ يسجل SW في `useEffect`؛ يعترض `updatefound` → toast «نسخة جديدة متاحة — أعد التحميل» (يعيد استخدام نظام toast الموجود). يُضاف في `StudentShell` و`DashboardShell` (الأدمن/الدكتور يرثانه).
3. تحديث `public/manifest.webmanifest`: `theme_color`/`background_color` يطابقان `#07060a` الموحد؛ `start_url: '/student'`; icons الحالية كافية (192/512 موجودتان في `/brand`).
4. CSP: إضافة `worker-src 'self'` في `middleware.ts` (CSP nonce الموجود) — وإلا SW محظور.

**الأسبوع 2 — Offline queue UX + Push:**
5. `/offline.html` جديد في `public/` — يعرض حالة الاتصال + آخر timetable مخزن (من نفس مفاتيح localStorage الحالية لـportal-prefs؟ لا — من cache SW) + زر مزامنة يدوية.
6. **Web Push (VAPID):** `src/lib/push.ts` — مفاتيح VAPID تُولّد مرة (`npx web-push generate-vapid-keys`) وتُخزن `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` في env (الـpublic يُحقن للعميل عبر `/api/push/vapid-key` — public key ليس سراً). جدول `PushSubscription { id, userId, endpoint UNIQUE, p256dh, auth, createdAt }` — `db push` **بعد backup** (`npm run db:backup:drive`).
7. `POST /api/push/subscribe` (auth أي دور) + تعديل `notifyUsers` — قناة ثالثة push (اختيارية، opt-in عبر `portal-prefs`/profile toggle «إشعارات المتصفح»).
8. Playwright: اختبار `tests/e2e/offline.spec.ts` — `page.route` يكسر `/api/student/dashboard` والصفحة تُظهر skeleton ثم المحتوى المخزن.
9. Lighthouse PWA audit — الهدف: installable ✓، works offline ✓.
10. Docs: `security-checklist.md` (SW لا يخزن grades)، `feature-matrix.md` (PWA 🟡→✅ جزئياً).

**ملفات تلمسها:** sw.js + offline.html + registrar + CSP line + notify.ts + push.ts + 2 routes + schema append + 1 E2E + docs.
**التحقق:** DevTools → Offline → الجدول يظهر؛ `np run test` كامل أخضر؛ بناء production نظيف.
**Kill criteria:** لو SW كشف تعارض مع CSP nonce في `middleware.ts` بحيث يكسر البوابات → نطلق SW بدون Web Push (المعدّل: subscribe مؤجل)، لا نؤجل الـoffline shell.

---

## 7. الرهان الرئيسي — FL: رادع رقيب الحصيف (Raqib Sentinel)

### 7.1 لماذا هذا هو الرهان؟
- يحمي **جوهر الهوية** («الحضور صار أذكى» — PITCH) بدل إضافة ميزة تجميلية.
- كل raw signals **موجودة اليوم**: geofence في `Lecture.geofence`، passkey أثناء المسح، IP/UA في `AuditLog`، unique constraint، نافذة 15 ثانية — المفقود فقط هو **الجمع + الذكاء + واجهة القرار البشري**.
- مجاني 100%: صفر خدمات خارجية؛ القواعد والفحص كلها كود.
- يعطي الكلية إجابة رسمية على أقدم اتهام للحضور الإلكتروني: «الطلاب يمسحون لبعضهم».
- يمنع تصعيداً أكبر لاحقاً (كاميرات/بصمة قاعة — رفضناها عمداً في القسم 4).

### 7.2 نطاق الـMVP (4–6 أسابيع، خلف feature flag)

**المرحلة 1 — الإشارات (الأسبوع 1–2):**
1. Backup كامل: `npm run db:backup:drive` + التحقق من restore على SQLite sandbox (`scripts/db-restore.mjs`) — DRILL إلزامي قبل أي `db push`.
2. إضافة `AttendanceSignal` للـschema (watch: المستودع بلا migrations — خطر موثق؛ البديل: جدول منفصل عبر `db push` فقط بعد الدummy restore drill):
   ```
   model AttendanceSignal {
     id            String   @id @default(cuid())
     attendanceId  String   @unique
     lectureId     String
     studentId     String
     ipHash        String
     uaHash        String
     deviceFpHash  String?
     geoAccuracyM  Float?
     secondsIntoWindow Int?   // كم ثانية بعد فتح المحاضرة تم المسح
     counterDelta  Int?       // passkey counter delta (إن توفر)
     createdAt     DateTime @default(now())
     @@index([lectureId, createdAt])
     @@index([deviceFpHash])
   }
   ```
   (hashes = SHA-256 بمفتاح سيرفر `SIGNAL_HASH_KEY` — لا fingerprint خام يُخزن.)
3. تعديل `src/app/api/attendance/scan/route.ts`: بعد `recordAttendance` ناجح → بناء Signal (geoAccuracy من body الموجود `accuracyM`؛ deviceFp من client header `X-Device-FP` — client يرسل hash محسوب بمكتبة خفيفة ~40 سطر في `src/lib/device-fp.ts`: canvas+webgl+timezone+lang — بدون مكتبة) → كتابة عبر Prisma في try/catch (فشل الإشارة **لا يفشل المسح**).
4. `AuditLog` يظل كما هو (المصدر التاريخي) — Signal جدول تحليلي منفصل.

**المرحلة 2 — محرك القواعد (الأسبوع 2–3):**
5. `src/lib/anomaly.ts` — دالة نقية `scoreSignals(signals, lectureCtx): AnomalyCard[]`:
   - R1: `deviceFpHash` مشترك بين ≥3 students نفس المحاضرة → +60.
   - R2: `ipHash` مشترك بين ≥4 students → +40.
   - R3: `geoAccuracyM` > 100 لنفس student عبر ≥3 محاضرات → +30.
   - R4: `secondsIntoWindow` < 2 أو في آخر 2 ثانية من نافذة 15s لنمط متكرر (≥3 مرات) → +20.
   - R5: غياب `counterDelta` positive مع passkey (استنتاج استنساخ استجابة) → +35 (إن توفرت الإشارة؛ وإلا تُتخطى القاعدة).
   - R6: نفس `ipHash` من خارج مدينة الإسماعيلية؟ — **لا GeoIP خارجي** (تكلفة/خصوصية) — تُستبدل: IP مشترك بمواقع لوكيشن متباعدة >5كم لنفس student → +40 (pure GPS).
   - R7: pattern «حاضر دائماً + Grade quiz < 20» — يذكر للدكتور فقط كسياق لا كتهمة.
   - R8: 10+ مسحات في نفس الثانية من نفس `deviceFpHash` → +70 (دفعة واحدة آلية).
   - Score ≥ 70 → بطاقة تلقائياً؛ 40–70 → تُجمَّع كـ«مراقبة» بدون badge.
6. Job: `scripts/anomaly-scan.mjs` — يفحص آخر محاضرة مُغلقة (أو بأمر `npm run anomaly:scan -- --lecture=<id>`)؛ يكتب بطاقات في جدول جديد `AnomalyCard { id, lectureId, studentId, ruleIds String(json), score Int, evidenceJson String, status String @default('OPEN'), reviewedById String?, reason String?, createdAt, updatedAt }` (`db push`).
7. الجدولة: تشغيله بعد **إغلاق كل محاضرة** — يُستدعى من route إغلاق المحاضرة الموجود (`/api/lectures` close — انظر `src/app/api/lectures`) بـfire-and-forget، **أو** يدوياً من الأدمن: «فحص الشذوذ الآن». لا cron معقد في v1.

**المرحلة 3 — صندوق المراجعة (الأسبوع 3–4):**
8. `GET /api/professor/attendance/anomalies?status=OPEN&courseId=…` — PROFESSOR + ownership؛ `POST …/[id]` يؤكد/يستبعد مع `reason` إلزامي (≥10 أحرف) → `AuditLog(ANOMALY_CONFIRMED|ANOMALY_DISMISSED)` + عند CONFIRM: `notifyUsers(student)` «رُصدت ملاحظة على حضورك — تواصل مع د. X» (لهجة محايدة، لا اتهام).
9. صفحة `/professor/attendance/anomalies/page.tsx` — بطاقات: الاسم، الكورس، القواعد المُفعلة، الدليل (ip/fp **مُقنَّع**: `102.x.x.x`، عدّ مشتركين)، الأزرار. فلترة + عداد OPEN في Sidebar الدكتور (badge).
10. الأدمن: `/admin/audit` يعرض أحداث ANOMALY_* ضمن نفس feed الموجود (لا صفحة جديدة).

**المرحلة 4 — المعايرة والإطلاق (الأسبوع 5–6):**
11. تشغيل صامت أسبوعين على مادة واحدة (مات 201 مثلاً) — بطاقات تُجمع في الأرشيف فقط **دون أي إشعار**؛ الدكتور يراجعها يدوياً ويصنّف true/false.
12. معايرة العتبات من النتائج الحقيقية (target: precision ≥ 70% عند score≥70، أو رفع العتبة) — جدول المعايرة يُوثّق في `docs/sentinel-calibration.md`.
13. الإطلاق: تفعيل على كل المواد + إشعار للدكاترة + فقرة في `DEMO-SCRIPT.md`؛ طالب يُبلَّغ فقط بعد قرار دكتور مطابق للوائح الكلية (نص الاتحاد الطلابي يُراجع مع الإدارة — **شرط إطلاق**).
14. صفحة `/admin/settings` — مفتاح `sentinel_enabled` (0 افتراضي) + عتبات R1–R8 قابلة للتعديل بلا deploy (`AppSetting` + إعادة تحميل في كل job).

**المرحلة 5 — الصلابة (الأسبوع 6):**
15. اختبارات: `tests/anomaly.spec.ts` (لكل قاعدة + تجميع)، Playwright journey للدكتور (فتح الصندوق → استبعاد بسبباً → الـbadge يختفي).
16. Retention job: `scripts/signals-purge.mjs` — يحذف Signals/cards الأقدم من 90 يوماً (policy مكتوبة في `permissions.md`).
17. تحديث: `security-checklist.md`، `permissions.md` (الوصول للبطاقات: صاحب الكورس + الأدمن فقط)، `feature-matrix.md`.

**الرهان على المخاطر:**
| الخطر | الاحتمال | الأثر | المعالجة |
|-------|----------|-------|-----------|
| إيجابيات كاذبة تُقلق طلاباً بريئين | متوسط | عالٍ | صامت أسبوعين + لا إشعار إلا بقرار دكتور + نص محايد |
| WiFi القاعة يخفي IP الحقيقي (proxy مشترك للكلية) | عالٍ | متوسط | R2 عتبة 4 وليست 2؛ وزن R2 أقل من R1 |
| طالب طعن في القرار | منخفض | عالٍ | workflow اعتراض: «اطلب مراجعة» → يعيد الفتح مع reason — audit trail كامل |
| تسريب hashes | منخفض | متوسط | `SIGNAL_HASH_KEY` منفصل عن JWT/PII keys (segregation — يعالج أيضاً ملاحظة audit §7!) |
| إرهاق دكتور | متوسط | متوسط | أقصى 20 بطاقة/أسبوع مرتبة، والباقي يتجمّع كإحصائية |

**مقاييس Flagship (تفصيل في القسم 9):** precision ≥ 70% بعد المعايرة · تغطية ≥ 90% من المسح يحمل Signal · 0 قرارات آلية ضد طالب · زمن مراجعة الدكتور ≤ 5 دقائق/أسبوع.

---

## 8. خارطة الطريق 30 / 60 / 90 يوم

| الفترة | الأهداف | المخرجات القابلة للتحقق | الاعتماد |
|--------|---------|------------------------|----------|
| **اليوم 0–30 (تأسيس + فوزات)** | QW1 رادار الخطر · QW2 عدسة الدرجات · QW3 SW/PWA · FL مرحلة 1 (Signals) + بداية مرحلة 2 · backup + restore drill | دكتور يرى watchlist حقيقية · توزيع الدرجات مطبوع · المنصة تفتح offline · 100% مسح يحمل Signal (بصمت) | موافقة المالك على QW1/2/3 وعلى schema append للـSignal |
| **اليوم 31–60 (الرهان)** | FL مراحل 3–4: صندوق المراجعة + تشغيل صامت على MAT201 · #5 نبضة الديجست الأسبوعي (opt-in) · #7 سلسلة رقيب (Quick add-on) · معايرة Sentinel | ≥70% precision مقاسة · أول digest يصل بريدك · طالب يفتح شارته في الـdashboard | قرار المالك بعد مراجعة نتائج التشغيل الصامت |
| **اليوم 61–90 (التوسع الذكي)** | FL إطلاق كامل على كل المواد · #11 لوحة الأثر (Sustainability/Cost) · #9 seat randomizer · تأسيس #1 RAG (chunking + provider abstraction فقط — **لا** واجهة بعد) · #10 voice check-in MVP | Sentinel حي على 7 مواد · تقرير «ورق موفّر» للكلية · RAG answer demo داخلي على مادة واحدة (خلف flag) | موافقة خصوصية مكتوبة لأي إرسال لمزود AI |

**ما بعد 90 يوم (الربع الثاني):** #1 Raqib AI Assistant كامل (UI + quotas) · #8 AI Quiz Drafts · #12 Schedule Optimizer · #5 نسخة ولي الأمر الكاملة (GuardianLink) · Web Push في #5. كلها مؤجلة بقرار، لا ملغاة.

---

## 9. مقاييس النجاح القابلة للقياس (Success Metrics) — لكل عنصر رئيسي

| المبادرة | Baseline اليوم | الهدف | طريقة القياس | الموعد |
|----------|----------------|-------|---------------|--------|
| QW1 رادار الخطر | غير موجود | ≥60% من الطلاب «تحت الخطر» يُكتشفون ≥4 أسابيع قبل الحرمان الفعلي (مقارنة مع بيانات الترم الماضي يدوياً) · اعتماد ≥3 دكاترة على القائمة أسبوعياً | audit log التفاعلات + ورقة معايرة | اليوم 30 |
| QW2 عدسة الدرجات | غير موجودة | ≥5 دكاترة يفتحون التوزيع ≥2 مرة/ترم · كل تقرير اعتماد كلية العلوم يتضمن توزيعاً مُولّداً من المنصة | عدّادات استخدام + نسخ PDF منتجة | اليوم 30 |
| QW3 أوف لاين | offline بيضاء | Lighthouse PWA ≥ installable + offline ✓ · ≥50 جلسة فتح بلا شبكة في القاعات (تبويب offline hits) · 0 بلاغ «المنصة ما فتحتش في المحاضرة» | Lighthouse + عدّاد `/offline.html` hits | اليوم 30 |
| FL Sentinel | 0 | precision ≥70% (بطاقات score≥70 المؤكدة) · ≥90% مسحات تحمل Signal · 0 عقوبة آلية · زمن مراجعة دكتور ≤5 د/أسبوع · ↓ ادعاءات «محدش يمسح لحد» بنسبة >50% في استطلاع الطلاب | تصنيف الدكتور + استطلاع anon + تقارير AuditLog | اليوم 60–75 |
| #5 الديجست | 0 بريد | ≥70% open rate لأول بريدين · ≥30% من الطلاب يفعّلون نسخة ولي الأمر · 0 شكاوى unsubscribe بفضل رابط الإلغاء | Resend dashboard + عدّاد opt-in | اليوم 60 |
| #7 السلسلة | لا توجد | ≥40% طلاب نشطون يفتحون StreakCard أسبوعياً · ↑ حضور في آخر محاضرتين قبل الامتحانات بمعدل ≥10 نقاط مئوية مقابل مجموعة ضابطة (CSU… لا — فرق A vs B) | عدّاد فتح + مقارنة حضور | اليوم 60 |
| #11 لوحة الأثر | غير موجودة | عدد واحد رسمي للكلية: «ورقة موفَّرة: N · جنيه موفَّر: M» — يُستخدم في عرض الاعتماد | صفحة impact + تصدير PDF | اليوم 75 |
| #1 RAG (90+) | 0 | على مادة واحدة: ≥4/5 أسئلة نموذجية تُجاب باستشهاد صحيح · 0 تسرب قروب آخر · رضا الطالب ≥4/5 | تقييم يدوي دكتور + استطلاع | اليوم 90+ |

**تعريف «النجاح» للمحفظة:** لو تحقق QW1+QW3+FL مقاييسها فقط بنهاية اليوم 60 → المحفظة تنجح حتى لو تأجل كل الذكاء الاصطناعي لربع آخر.

---

## 10. التكلفة التشغيلية الكلية (Total Cost of Ownership)

| البند | الحصة المجانية (نوفمبر 2026) | استهلاكنا المتوقع | التكلفة |
|-------|------------------------------|---------------------|---------|
| Neon Postgres free | 0.5 GB تخزين · ~190 ساعة compute/شهر | < 30 MB بيانات قسم | $0 |
| Vercel Hobby | bandwidth كافٍ لقسم + serverless محدود | < 10% الحصة | $0 |
| Resend free | ≈100 بريد/يوم · ≈3,000/شهر | ≈200 بريد/شهر (digest + تنبيهات) | $0 |
| Gemini Flash-Lite free | ≈1,000–1,500 req/يوم (تتغير — تُراجع شهرياً) | <300/يوم (RAG + quiz drafts على مادة واحدة) | $0 |
| Web Push (VAPID + FCM) | مجاني بلا حد عملي | تذكيرات اختيارية | $0 |
| Google Drive (rclone/REST) | 15 GB مجاني على أي حساب Gmail | أصول + backups (<2 GB) | $0 |
| Sentry/مراقبة | — | نستخدم `/api/health` + AuditLog (موجود) — لا Sentry افتراضي | $0 |
| Domain | موجود (hadour.com/vercel) | — | $0 إضافي |
| **الإجمالي** | | | **≈ $0/شهر** |

**قاعدة صارمة:** أي مبادرة تتطلب > $0 بمتوسط شهري → تُعرض على المالك بخيار مجاني أو تُلغى. ملاحظة Neon: كل مبادرة schema تُسبق بـbackup + restore drill (لا توجد migrations — الخطر معروف ومُوثّق).

**ما ندفعه من وقت:** ~0.5–1 يوم/أسبوع مراجعة AI/فلترة شذوذ — وهو الوقت المحرَّر أصلاً من عدم النداء اليدوي للأسماء.

---

## 11. المخاطر الكلية وقرارات «لا» واعية

**قرارات سلبية واعية (explicit non-goals):**
- ❌ لا تطبيق Android/iOS native — PWA تغطي (Rule: no unnecessary infra).
- ❌ لا بصمة وجه/صوت قاعة للمراقبة — تدخل في الخصوصية وهو محظور أخلاقياً وعملياً.
- ❌ لا لوائح شرف علنية للحضور — تقسيم طلابي وخرق خصوصية.
- ❌ لا LLM في نقطة التحصين (edge) — كل AI في مسارات API فقط وخلف quota.
- ❌ لا استبدال `db push` بـmigrations هذا الربع — لكن **كل** schema change يُسبق بـbackup + restore drill موثق.
- ❌ لا قرار آلي عقابي (حرمان تلقائي) — البشر يقررون دائماً (Rule 09/11).

**مصفوفة المخاطر الكلية:**
| الخطر | المعالجة |
|-------|-----------|
| انحراف الحصص المجانية (Resend/Gemini تُغيِّر شروطها) | abstraction `src/lib/ai/provider.ts` + تنبيهات في `/admin/system` عند 80% الحصة؛ كل ميزة AI لها kill switch في `AppSetting` |
| تسريب PII لمزود خارجي | صفر PII في أي prompt (مواد + أسئلة فقط) · موافقة مكتوبة قبل تفعيل #1/#8 |
| نمو scope creep | كل مبادرة في هذه الوثيقة لها kill criteria؛ المتجاوز يُجمَّد للربع التالي |
| اعتماد على شخص واحد | كل مبادرة تنتهي بـdocs في `docs/` + اختبار vitest — المعرفة تخرج من رأس المبرمج |
| البيانات الديمو الملوثة (Neon فيها مواد/جداول ديمو بعد purge الجزئي — project-audit §3) | **لا تُقاس أي metric على بيانات ديمو**؛ المقاييس تبدأ من ترم حقيقي فارغ بعد purge المعتمد |

---

## 12. سجل الأدلة (Evidence Index) — الملفات المُستشهد بها

| الادعاء | الدليل |
|---------|--------|
| لا يوجد أي AI في الكود | `grep "GEMINI\|openai\|anthropic" src/` → لا نتائج؛ `.env.example` بلا مفاتيح AI |
| لا service worker | `grep "serviceWorker" src/ public/` → لا نتائج؛ `public/manifest.webmanifest` موجود فقط |
| حضور QR بإشارات جاهزة | `src/app/api/attendance/scan/route.ts` (JWT verify + geofence + passkey path) · `src/lib/qr-sign.ts` · `src/lib/qr.ts` · `Lecture.geofence` في `prisma/schema.prisma` |
| سياسة حضور جاهزة مشتقة | `src/lib/attendance-policy.ts` (75/25/0.5 + SAFE/WARNING/DENIED) |
| `final` لا يُحفظ | `src/app/api/grades/me` يعرض final لكن audit يوثق أن `PUT /api/grades` يتجاهله — `project-audit.md §5` |
| الإشعارات بالبريد موجودة وغير مستغلة | `src/lib/notify.ts` (RESEND_API_KEY + graceful skip) · `src/lib/mailer.ts` |
| AuditLog IP/UA لكل مسح | feature-matrix §Cross-cutting + `prisma/schema.prisma` model AuditLog |
| طابور مسح offline موجود | BRAND.md Blueprint v5 · item #15 (`queueOfflineScan` + `PortalAgent`) |
| CSV export موجود | `src/lib/exporters.ts` (`toCSV` + BOM + vitest) — BRAND.md #12 |
| بوابات كاملة تعمل DB-backed | `docs/project-audit.md §2` · `docs/feature-matrix.md` |
| Gemini/RAG مخطط لكن غير منفذ | `docs/implementation-roadmap.md` Phase 8 · feature-matrix §AI = ❌ |
| Resend مجاني + limits | `.env.example` §mail (RESEND_API_KEY موجود، غير مفعّل) |
| PII encrypted + backups مشفرة | `src/lib/db.ts` · `scripts/db-backup-drive.mjs` · audit §2 |

---

## 13. ما المطلوب من المالك للبدء (Owner Decisions Needed)

1. **موافقة** على QW1/QW2/QW3 (لا schema destructive؛ QW3 يضيف عمود PushSubscription عبر `db push` بعد backup).
2. **موافقة مبدئية** على FL Sentinel بمراحله (بدء صامت، لا إشعارات للطلبة قبل 6 أسابيع) + على schema append (`AttendanceSignal`, `AnomalyCard`) عبر `db push` بعد restore drill.
3. **قرار** عن نسخة ولي الأمر في الديجست (MVP = بريد الطالب فقط) — نعم/لا.
4. **تفويض أو رفض** مبدئي لفتح Phase RAG في الربع الثاني (يحتاج موافقة خصوصية منفصلة لاحقاً).
5. **اعتماد المقاييس** في القسم 9 كأهداف الترم القادم.

> بعد موافقة المالك: كل مبادرة تُنفَّذ كـPhase مصغَّر مستقلاً (خطة → تنفيذ → اختبارات → docs → تقرير) التزاماً بـ`agent.md` Rule 03/16 — لا تُكتب أي شفرة قبلها.
