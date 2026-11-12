# RAQEEB — التسجيل الذاتي + Exam Studio (2026-11-08)

> **Rule 16 report** — تنفيذ تفويض المالك: «نفّذ يكبير وطوّر براحتك بطريقة احترافية وزود فويتشرز كتير».
> كل شيء هنا **إضافي** (4 جداول جديدة فقط، بدون أي تغيير على جدول قائم وبدون حذف أي بيانات).
> التحقق تم على قاعدة SQLite مؤقتة محلية (`prisma/dev-verify.db`) منفصلة تمامًا عن Neon الإنتاجية.

## 1. ماذا أُنجز

### أ) التسجيل الذاتي — `/student/registration` (جديد)
- **القواعد المفروضة خادميًا داخل معاملة**: ≤ `credit_limit` (افتراضي 17، يضبطه الأدمن)، منع التكرار (أو استعادة تسجيل "مسحوب")، منع تعارض المواعيد لنفس الجروب والترم (نفس اليوم+الحصة)، تفعيل/حفظ سجل التدقيق في نفس المعاملة (`ENROLLMENT_ADD/REENAABLE/DROP`).
- **تعارض المواعيد (ملاحظة معمارية)**: القيد الفريد `(group, day, period, term)` في ScheduleSlot يمنع بنيويًا وجود مادتين لنفس الجروب في نفس الخانة. لذلك نفس الجروب لا يمكن أن يتعارض أبدًا — والتعارض الحقيقي الوحيد هو **عبر الشعب**: مقرر لا يُعقد إلا لشعبة جروب آخر بنفس التوقيت (يوم+حصة). المحرك (`effectiveCandidateSlots`) يعالج هذه الحالة: يحضر الطالب شعبة جروبه لو موجودة، وإلا الشعبة المتاحة لأي جروب — ويقارن زمنيًا بحت. مغطى باختبارات (4 اختبارات جديدة).
- **السحب = `status=DROPPED`** — لا حذف أبدًا (Rule 05)، ويمكن التسجيل تاني لو تغيرت الظروف.
- UI: حلقة الساعات المعتمدة، تبويبات «المتاحة / مقرراتي»، بطاقات مقررات مع خانات الجدول، شارة «تعارض مواعيد» بتفاصيل الخانات، زر تسجيل مُعطل مع قائمة أسباب واضحة لو مغلق، تأكيد بالسحب عبر `window.confirm`.
- محرك القواعد في `src/lib/enrollment.ts` — pure + مغطى باختبارات (17 ساعة بالضبط، التجاوز، التعارض المزدوج، Describe conflict).

### ب) Exam Studio كاملة
**بوابة الدكتور** `/professor/exams`:
- إنشاء امتحان (مقرر، عنوان، تعليمات، نافذة فتح/إغلاق، مدة، `DRAFT`).
- صفحة إدارة الامتحان `/professor/exams/[id]`: إضافة أسئلة من 4 أنواع:
  - **MCQ** — حتى 6 اختيارات، الإجابة الصحيحة، تصحيح آلي.
  - **TRUE_FALSE** — صح/خطأ، تصحيح آلي.
  - **SHORT** — إجابات مقبولة متعددة، تصحيح آلي **بعد تطبيع العربية** (همزات/تاء مربوطة/ألف مقصورة/تشكيل/فراغات) في `src/lib/answer.ts`.
  - **ESSAY** — بلا تصحيح آلي إطلاقًا؛ rubric للدكتور فقط (لا تُرسل للطالب أبدًا).
- دورة الحياة: `DRAFT → PUBLISHED → CLOSED` + `resultsVisible` — نشر بدون أسئلة مرفوض، لا تعديل جوهري بعد النشر، لا حذف لما الامتحان منشور (حفاظًا على تسليمات الطلاب).
- تصحيح المقالي: لوحة لكل محاولة، درجة 0..marks + ملاحظة، مع **منع تجاوز حد السؤال**. الأسئلة الموضوعية **لا تُلمس يدويًا** (Rule 10/11) — حتمية بالكامل.
- تصدير CSV للنتائج، ملخص محاولات (submitted/graded/avgScore).

**بوابة الطالب** `/student/exams`:
- قائمة الامتحانات (متاحة الآن / استئناف / سلّمت)، نافذة الفتح والإغلاق محترمة خادميًا، **محاولة واحدة فقط** (unique `[examId, studentId]`)، استئناف idempotent (فتح الصفحة تاني = نفس المحاولة).
- **العدّاد حي** + تسليم تلقائي عند الصفر + `beforeunload` يمنع مغادرة الصامتة + منع إظهار أي درجة قبل النشر.
- التصحيح: MCQ/TF/SHORT آليًا — و**الإجابة القصيرة تُقبل بغض النظر عن التشكيل/الهمزات**. المقالي بانتظار الدكتور.
- رد التسليم **لا يحمل أي درجة** — النتائج تفتح بقرار الدكتور فقط (`show-results`) + إشعار للطلاب المسلّمين.
- `/student/exams/[id]/review` — مراجعة كاملة بعد النشر: إجابتك vs الصحيحة + نموذج الدكتور + ملاحظته + درجة لكل سؤال.

### ج) تجهيزات مكمّلة
- ⌘K والـ Navbar وصفحات الطال/الدكتور وروابط سريعة للميزتين.
- لوحة الأوامر والـNavbar يعيان بالدور — التنقل الجديد ظاهر للجميع.
- ورقة طباعة موجودة بالفعل في `/student/report` — أُبقي عليها (معاينة «طباعة/PDF» جاهزة).

## 2. الملفات

**جديدة:** `src/lib/enrollment.ts` · `src/lib/answer.ts` · `src/lib/exam.ts` · `src/app/api/student/registration/route.ts` · `src/app/api/professor/exams/route.ts` · `src/app/api/professor/exams/[id]/route.ts` · `src/app/api/professor/exams/[id]/questions/route.ts` · `src/app/api/professor/exams/[id]/questions/[questionId]/route.ts` · `src/app/api/professor/exams/[id]/publish/route.ts` · `src/app/api/professor/exams/[id]/attempts/route.ts` · `src/app/api/student/exams/route.ts` · `src/app/api/student/exams/start/route.ts` · `src/app/api/student/exams/submit/route.ts` · `src/app/api/student/exams/review/route.ts` · `src/app/student/registration/page.tsx` · `src/app/student/exams/page.tsx` · `src/app/student/exams/[id]/page.tsx` · `src/app/student/exams/[id]/review/page.tsx` · `src/app/professor/exams/page.tsx` · `src/app/professor/exams/[id]/page.tsx` · `tests/enrollment.spec.ts` · `tests/answer.spec.ts` · `scripts/dev-verify-seed.ts` · `scripts/dev-verify-e2e.mjs`
**معدلة:** `prisma/schema.prisma` (+Exam/Question/ExamAttempt/StudentAnswer — additive فقط) · `src/components/Navbar.tsx` · `src/components/shared/CommandPalette.tsx` · `src/components/obsidian/nav.ts` · `src/app/student/page.tsx` · `src/app/professor/page.tsx`

## 3. التحقق (صادق 100%)

| الفحص | النتيجة |
|---|---|
| `npx tsc --noEmit` | ✅ |
| `npx vitest run` | ✅ 90 اختبارًا (منها 21 جديدًا: enrollment + answer + risk) |
| `node scripts/build.mjs` مع `DATABASE_URL=file:./dev-verify.db` | ✅ exit 0 |
| **E2E حي ضد خادم محلي على SQLite مؤقتة** (`scripts/dev-verify-e2e.mjs`) | ✅ **40/40 نجح** — دخول الأدوار، 401/403 للأدوار الخاطئة، رحلة التسجيل كاملة (0→3→7→15 + منع التكرار + تعارض المواعيد عبر الشعب (الجروب A ضد شعبة الجروب B في نفس التوقيت) + منع تجاوز 17)، رحلة الامتحان كاملة (إنشاء ← رفض النشر بدون أسئلة ← 4 أنواع ← نشر ← بدء ← لا مفاتيح للطالب ← تسليم بلا درجة ← idempotent ← تصحيح مقالي 4/5 ← رفض فوق الحد ← نشر النتائج ← الدرجة 9 ← المراجعة ← منع غير المسجل) |
| Neon الإنتاجية | **لم تُلمس إطلاقًا** — التحقق كله على SQLite مؤقتة تُحذف بعد الاختبار |

## 4. ما يتطلبه التشغيل الفعلي على Neon (أمر واحد — بموافقتك)

```bash
npm run db:push:pg
```

ينشئ الجداول الأربعة الجديدة + الحقول العلائقية على `Exam/Question/ExamAttempt/StudentAnswer` — بدون أي تعديل على بيانات قائمة. **لم أنفذه** لأن الإنتاج يحتاج موافقة صريحة (Rule 16). حتى هذه اللحظة: الكود منشور، والمسارات الجديدة تعمل على SQLite المؤقتة، وستعمل على Neon فور تنفيذ الأمر.

## 5. قيود معروفة
- **سباق الساعات النظري**: ضمان ≤17 ساعة يعتمد على إعادة القراءة داخل المعاملة + القيد الفريد `(studentId, courseId)` — وليس serializable isolation (SQLite لا يدعمه). في مقياس التجربة (180 طالب) الخطر عمليًا معدوم؛ وإن أردت ضمانًا مطلقًا على Postgres يمكن `SELECT … FOR UPDATE` داخل المعاملة لاحقًا.
- **لا يوجد Autosave أثناء الامتحان** — التسليم النهائي فقط (الصفحة تحذر قبل المغادرة). التحسين المقترح: heartbeat كل 30 ثانية يحفظ `answerText` كمسودة.
- ترتيب الأسئلة عشوائي — غير مطبق عمدًا (يمكن إضافته بـ `orderBy` عشوائي لاحقًا بدون تغيير المخطط).
- Resend/الإشعار عند نشر الامتحان والنتائج — يعمل فقط لو `RESEND_API_KEY` مضبوط (غيري graceful-skip موثق).
- تصحيح `SHORT` لا يقبل أخطاء إملائية جزئية — المطابقة تامة بعد التطبيع عن قصد (دقة > تسامح في سياق الامتحانات).
