/**
 * 🧪 اختبار تكامل حي (E2E) ضد نسخة محلية مؤقتة على قاعدة dev-verify.db.
 * يتحقق من: التسجيل الذاتي (17 ساعة + التعارضات) و Exam Studio كاملة.
 * يُشغَّل مع الخادم الإنتاجي المحلي: BASE=http://127.0.0.1:PORT
 * لا يلمس Neon — قاعدة file:./dev-verify.db فقط (انظر dev-verify-seed.mjs).
 */

const BASE = process.env.BASE || 'https://127.0.0.1:5321';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // شهادة محلية self-signed للاختبار فقط

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      // المتصفح يرسل Origin + Sec-Fetch-Site — middleware يرفض الطلبات بلا أصل موثوق (CSRF)
      origin: BASE,
      'sec-fetch-site': 'same-origin',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML response */ }
  return { status: res.status, json, text, setCookie };
}

function cookieFrom(res) {
  if (!res.setCookie || res.setCookie.length === 0) return null;
  // نلتقط اسم=قيمة من كل كوكيز الرد
  return res.setCookie.map((part) => String(part).split(';')[0].trim()).filter(Boolean).join('; ');
}

async function login(email, password) {
  const res = await api('/api/auth/login', { method: 'POST', body: { identifier: email, password } });
  return { cookie: cookieFrom(res), status: res.status, body: res.json };
}

const stamp = Date.now().toString(36);

async function main() {
  console.log(`\n[e2e] base=${BASE}\n`);

  console.log('— تسجيل الدخول —');
  const student = await login('student@verify.local', 'Dev!Pass123');
  ok('الطالب يسجل دخوله', student.cookie && student.status === 200, `status=${student.status}`);
  const professor = await login('prof@verify.local', 'Dev!Pass123');
  ok('الأستاذ يسجل دخوله', professor.cookie && professor.status === 200, `status=${professor.status}`);
  const anon = await api('/api/student/registration');
  ok('غير المصادق → 401', anon.status === 401, `status=${anon.status}`);
  const wrongRole = await api('/api/professor/exams', { cookie: student.cookie });
  ok('طالب لا يدخل مسارات الأستاذ', [401, 403].includes(wrongRole.status), `status=${wrongRole.status}`);

  console.log('\n— التسجيل الذاتي (17 ساعة + تعارض المواعيد) —');
  let reg = await api('/api/student/registration', { cookie: student.cookie });
  ok('GET registration يعمل', reg.status === 200, `status=${reg.status}`);
  ok('يبدأ بصفر ساعات', reg.json?.credits?.enrolled === 0, JSON.stringify(reg.json?.credits));
  const courses = reg.json?.available ?? [];
  const vrf101 = courses.find((c) => c.code === 'VRF101');
  const vrf201 = courses.find((c) => c.code === 'VRF201');
  const vrf305 = courses.find((c) => c.code === 'VRF305');
  const vrf203 = courses.find((c) => c.code === 'VRF203');
  ok('المقررات الأربعة متاحة', [vrf101, vrf201, vrf305, vrf203].every(Boolean));
  ok('VRF305 متاح مبدئيًا (لا تعارض بلا تسجيلات)', (vrf305?.conflicts?.length ?? 0) === 0);

  // 1) تسجيل VRF101 (3 ساعات)
  let res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf101.id, action: 'enroll' } });
  ok('تسجيل VRF101 ينجح (3/17)', res.status === 200 && res.json?.credits?.enrolled === 3, JSON.stringify(res.json));
  // 2) تكرار التسجيل → 409
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf101.id, action: 'enroll' } });
  ok('تكرار التسجيل → 409', res.status === 409, `status=${res.status}`);
  // 3) تعارض المواعيد مع VRF101 (نفس اليوم+الحصة: يوم 2 / حصة 1) → 409
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf305.id, action: 'enroll' } });
  ok('تعارض المواعيد يمنع التسجيل', res.status === 409 && /تعارض/.test(res.json?.error || ''), JSON.stringify(res.json));
  // 4) تسجيل VRF201 (4 ساعات) → 7
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf201.id, action: 'enroll' } });
  ok('تسجيل VRF201 ينجح (7/17)', res.status === 200 && res.json?.credits?.enrolled === 7, JSON.stringify(res.json));
  // 5) تسجيل VRF203 (8 ساعات) → 15
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf203.id, action: 'enroll' } });
  ok('تسجيل VRF203 ينجح (15/17)', res.status === 200 && res.json?.credits?.enrolled === 15, JSON.stringify(res.json));
  // 6) أي إضافة الآن تتجاوز الحد → 409 (15 + 3 > 17)
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf101.id, action: 'drop' } });
  ok('سحب VRF101 ينجح (12/17)', res.status === 200 && res.json?.credits?.enrolled === 12, JSON.stringify(res.json));
  // 7) الآن VRF305: لا تعارض (VRF101 مسحوب) و12+3 ≤ 17 → ينجح
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf305.id, action: 'enroll' } });
  ok('بعد السحب: VRF305 يُقبل (15/17)', res.status === 200 && res.json?.credits?.enrolled === 15, JSON.stringify(res.json));
  // 8) إعادة تسجيل VRF101 → 18 > 17 → 409 بحد الساعات
  res = await api('/api/student/registration', { method: 'POST', cookie: student.cookie, body: { courseId: vrf101.id, action: 'enroll' } });
  ok('تجاوز حد الساعات يُمنع (18 > 17)', res.status === 409 && /الحد الأقصى/.test(res.json?.error || ''), JSON.stringify(res.json));

  console.log('\n— Exam Studio كاملة (إنشاء ← نشر ← أداء ← تصحيح ← نشر النتائج) —');
  // الأستاذ ينشئ امتحانًا على VRF101 (مسجل الطالب؟ لا — نحن نسحب VRF101... الطالب مسجل الآن في VRF201, VRF203, VRF305)
  // نستخدم VRF305 المسجل لدى الطالب
  reg = await api('/api/student/registration', { cookie: student.cookie });
  const enrolledNow = reg.json?.enrolled ?? [];
  const examCourse = enrolledNow.find((c) => c.code === 'VRF305') ?? enrolledNow[0];
  ok('مقرر الامتحان مسجل لدى الطالب', Boolean(examCourse));

  const created = await api('/api/professor/exams', {
    method: 'POST',
    cookie: professor.cookie,
    body: { courseId: examCourse.id, title: `امتحان التحقق ${stamp}`, durationMinutes: 30 },
  });
  ok('الأستاذ ينشئ امتحانًا', created.status === 201 && Boolean(created.json?.exam?.id), JSON.stringify(created.json));
  const examId = created.json?.exam?.id;

  // نشر بدون أسئلة → يُرفض
  let pub = await api(`/api/professor/exams/${examId}/publish`, { method: 'POST', cookie: professor.cookie, body: { action: 'publish' } });
  ok('النشر بدون أسئلة مرفوض', pub.status === 409, `status=${pub.status}`);

  // إضافة الأسئلة الأربعة
  const q1 = await api(`/api/professor/exams/${examId}/questions`, {
    method: 'POST', cookie: professor.cookie,
    body: { kind: 'MCQ', prompt: 'ما مشتقة س²؟', marks: 2, options: ['س', '2س', 'س²'], correctIndex: 1 },
  });
  ok('إضافة MCQ', q1.status === 201, JSON.stringify(q1.json));
  const q2 = await api(`/api/professor/exams/${examId}/questions`, {
    method: 'POST', cookie: professor.cookie,
    body: { kind: 'TRUE_FALSE', prompt: 'الأرض مسطحة.', marks: 1, correctIndex: 1 },
  });
  ok('إضافة صح/خطأ', q2.status === 201, JSON.stringify(q2.json));
  const q3 = await api(`/api/professor/exams/${examId}/questions`, {
    method: 'POST', cookie: professor.cookie,
    body: { kind: 'SHORT', prompt: 'من وضع قوانين الحركة؟', marks: 2, acceptedAnswers: ['نيوتن', 'Newton'] },
  });
  ok('إضافة إجابة قصيرة', q3.status === 201, JSON.stringify(q3.json));
  const q4 = await api(`/api/professor/exams/${examId}/questions`, {
    method: 'POST', cookie: professor.cookie,
    body: { kind: 'ESSAY', prompt: 'اشرح الحرب العالمية الأولى في سطرين.', marks: 5, rubric: 'أسباب سياسية + تحالفات + شرارة سراييفو' },
  });
  ok('إضافة مقالي', q4.status === 201, JSON.stringify(q4.json));

  // نشر الامتحان
  pub = await api(`/api/professor/exams/${examId}/publish`, { method: 'POST', cookie: professor.cookie, body: { action: 'publish' } });
  ok('النشر ينجح مع أسئلة', pub.status === 200, JSON.stringify(pub.json));

  // الطالب يرى الامتحان في قائمته
  const list = await api('/api/student/exams', { cookie: student.cookie });
  const listed = (list.json?.exams ?? []).find((e) => e.id === examId);
  ok('الامتحان يظهر للطالب', Boolean(listed));

  // بدء المحاولة
  const start = await api('/api/student/exams/start', { method: 'POST', cookie: student.cookie, body: { examId } });
  ok('بدء المحاولة', start.status === 200 && Boolean(start.json?.attempt?.id), JSON.stringify(start.json));
  const attemptId = start.json?.attempt?.id;
  const questionsSent = start.json?.questions ?? [];
  ok('الأسئلة بلا مفاتيح إجابات', questionsSent.every((q) => q.correctIndex === undefined && q.rubric === undefined && q.acceptedAnswers === undefined));
  ok('عدد الأسئلة 4', questionsSent.length === 4);

  // تسليم إجابات (MCQ صحيح، TF صحيح، SHORT صحيح، مقالي بإجابة)
  const byKind = Object.fromEntries(questionsSent.map((q) => [q.kind, q]));
  const draft = await api('/api/student/exams/draft', {
    method: 'POST', cookie: student.cookie,
    body: { attemptId, answers: [{ questionId: byKind.MCQ.id, selectedIndex: 1 }] },
  });
  ok('الحفظ التلقائي يثبت المسودة على الخادم', draft.status === 200 && draft.json?.ok === true);
  const resumed = await api('/api/student/exams/start', { method: 'POST', cookie: student.cookie, body: { examId } });
  ok('استئناف المحاولة يسترجع الإجابة', resumed.json?.draftAnswers?.some((a) => a.questionId === byKind.MCQ.id && a.selectedIndex === 1));
  const foreignDraft = await api('/api/student/exams/draft', {
    method: 'POST', cookie: student.cookie,
    body: { attemptId, answers: [{ questionId: 'foreign-question', answerText: 'x' }] },
  });
  ok('رفض سؤال لا ينتمي للامتحان في المسودة', foreignDraft.status === 400);
  const wrongRoleDraft = await api('/api/student/exams/draft', {
    method: 'POST', cookie: professor.cookie,
    body: { attemptId, answers: [] },
  });
  ok('الدكتور لا يكتب في مسودة الطالب', [401, 403].includes(wrongRoleDraft.status));
  const submitRes = await api('/api/student/exams/submit', {
    method: 'POST', cookie: student.cookie,
    body: {
      attemptId,
      answers: [
        { questionId: byKind.MCQ.id, selectedIndex: 1 },
        { questionId: byKind.TRUE_FALSE.id, selectedIndex: 1 },
        { questionId: byKind.SHORT.id, answerText: '  نيوُتـن  ' },
        { questionId: byKind.ESSAY.id, answerText: 'اندلعت بسبب التحالفات والأزمة بين النمسا والدوق فيرديناند.' },
      ],
    },
  });
  ok('التسليم ينجح', submitRes.status === 200 && submitRes.json?.ok === true, JSON.stringify(submitRes.json));
  ok('لا درجة في رد التسليم', submitRes.json?.score === undefined && submitRes.json?.attempt === undefined);

  // تسليم مكرر → idempotent
  const submit2 = await api('/api/student/exams/submit', { method: 'POST', cookie: student.cookie, body: { attemptId, answers: [] } });
  ok('التسليم المكرر idempotent', submit2.status === 200 && submit2.json?.alreadySubmitted === true, JSON.stringify(submit2.json));
  const lateDraft = await api('/api/student/exams/draft', {
    method: 'POST', cookie: student.cookie,
    body: { attemptId, answers: [{ questionId: byKind.MCQ.id, selectedIndex: 0 }] },
  });
  ok('لا يمكن تعديل المسودة بعد التسليم', lateDraft.status === 409);

  // الأستاذ يرى المحاولة ويصحح المقالي (4/5)
  const attempts = await api(`/api/professor/exams/${examId}/attempts`, { cookie: professor.cookie });
  const mine = (attempts.json?.attempts ?? []).find((a) => a.id === attemptId);
  ok('المحاولة مسجلة عند الأستاذ', Boolean(mine));
  const essayQ = questionsSent.find((q) => q.kind === 'ESSAY');
  const gradeRes = await api(`/api/professor/exams/${examId}/attempts`, {
    method: 'PATCH', cookie: professor.cookie,
    body: { attemptId, answers: [{ questionId: essayQ.id, awardedMarks: 4, feedback: 'إجابة جيدة — تحتاج تفاصيل أكثر' }] },
  });
  ok('تصحيح المقالي (4/5)', gradeRes.status === 200 && gradeRes.json?.score === 9, JSON.stringify(gradeRes.json)); // 2+1+2+4 = 9

  // محاولة إعطاء أكثر من الحد → تُرفض
  const over = await api(`/api/professor/exams/${examId}/attempts`, {
    method: 'PATCH', cookie: professor.cookie,
    body: { attemptId, answers: [{ questionId: essayQ.id, awardedMarks: 99 }] },
  });
  ok('درجة المقالي تتجاوز الحد تُرفض', over.status === 400, `status=${over.status}`);

  // نشر النتائج
  const show = await api(`/api/professor/exams/${examId}/publish`, { method: 'POST', cookie: professor.cookie, body: { action: 'show-results' } });
  ok('نشر النتائج', show.status === 200 && show.json?.resultsVisible === true, JSON.stringify(show.json));

  // الطالب يرى درجته بعد النشر فقط
  const listAfter = await api('/api/student/exams', { cookie: student.cookie });
  const listedAfter = (listAfter.json?.exams ?? []).find((e) => e.id === examId);
  ok('الطالب يرى درجته بعد النشر', listedAfter?.myAttempt?.score === 9, JSON.stringify(listedAfter?.myAttempt));

  // مراجعة التصحيح
  const review = await api(`/api/student/exams/review?examId=${examId}`, { cookie: student.cookie });
  ok('مراجعة التصحيح تعمل بعد النشر', review.status === 200 && review.json?.questions?.length === 4, `status=${review.status}`);
  ok('المراجعة تُظهر مفتاح MCQ', review.json?.questions?.find((q) => q.kind === 'MCQ')?.correctIndex === 1);

  // طالب آخر لا يرى الامتحان في التسجيل (غير مسجل) — أو يراه لكن لا يبدأ
  const student2 = await login('student2@verify.local', 'Dev!Pass123');
  ok('الطالب الثاني يسجل دخوله', Boolean(student2.cookie));
  const start2 = await api('/api/student/exams/start', { method: 'POST', cookie: student2.cookie, body: { examId } });
  ok('طالب غير مسجل في المقرر لا يبدأ الامتحان', start2.status === 403, `status=${start2.status}`);

  console.log(`\n[e2e] النتيجة: ${passed} نجح · ${failed} فشل`);
  if (failures.length) {
    console.log('[e2e] الإخفاقات:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error('[e2e] exception:', error);
  process.exit(1);
});
