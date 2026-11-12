'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  PencilLine,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import EmergencyBanner from '@/components/shared/EmergencyBanner';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toCSV, downloadBlob } from '@/lib/exporters';
import { cn } from '@/lib/utils';

type QuestionKind = 'MCQ' | 'TRUE_FALSE' | 'SHORT' | 'ESSAY';

type Question = {
  id: string;
  ord: number;
  kind: QuestionKind;
  prompt: string;
  options: string | null;
  correctIndex: number | null;
  acceptedAnswers: string | null;
  rubric: string | null;
  marks: number;
};

type AttemptRow = {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  student: { id: string; name: string; studentCode: string | null; group: string | null };
  answers: {
    questionId: string;
    answerText: string | null;
    selectedIndex: number | null;
    awardedMarks: number | null;
    isCorrect: boolean | null;
    feedback: string | null;
    gradedBy: string | null;
  }[];
};

type ExamDetail = {
  exam: {
    id: string;
    title: string;
    instructions: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    startsAt: string | null;
    endsAt: string | null;
    durationMinutes: number;
    totalMarks: number;
    resultsVisible: boolean;
    course: { id: string; code: string; name: string };
  };
  questions: Question[];
  attemptsSummary: { total: number; submitted: number; graded: number; avgScore: number | null };
};

type AttemptsResponse = {
  exam: { id: string; title: string; totalMarks: number; resultsVisible: boolean; status: string };
  questions: Pick<Question, 'id' | 'ord' | 'kind' | 'prompt' | 'marks' | 'rubric' | 'correctIndex'>[];
  attempts: AttemptRow[];
};

const KIND_LABEL: Record<QuestionKind, string> = {
  MCQ: 'اختيار من متعدد',
  TRUE_FALSE: 'صح / خطأ',
  SHORT: 'إجابة قصيرة',
  ESSAY: 'مقالي',
};

const KIND_CHIP: Record<QuestionKind, string> = {
  MCQ: 'border-sky-500/30 bg-sky-500/10 text-sky-800',
  TRUE_FALSE: 'border-amber-500/30 bg-amber-500/10 text-amber-800',
  SHORT: 'border-violet-500/30 bg-violet-500/10 text-violet-800',
  ESSAY: 'border-gold-500/30 bg-gold-500/10 text-gold-800',
};

const STATUS_CHIP = {
  DRAFT: 'border-ink-300 bg-ink-900/[0.06] text-ink-600',
  PUBLISHED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  CLOSED: 'border-ink-400 bg-ink-900/[0.10] text-ink-700',
} as const;
const STATUS_LABEL = { DRAFT: 'مسودة', PUBLISHED: 'منشور', CLOSED: 'مغلق' } as const;

function parseJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function ProfessorExamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;

  const [detail, setDetail] = React.useState<ExamDetail | null>(null);
  const [attemptsData, setAttemptsData] = React.useState<AttemptsResponse | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [expandedAttempt, setExpandedAttempt] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [detailData, attemptsResponse] = await Promise.all([
        api<ExamDetail>(`/api/professor/exams/${examId}`),
        api<AttemptsResponse>(`/api/professor/exams/${examId}/attempts`),
      ]);
      setDetail(detailData);
      setAttemptsData(attemptsResponse);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function lifecycle(action: 'publish' | 'close' | 'show-results' | 'hide-results') {
    const confirms: Record<string, string | null> = {
      publish: 'نشر الامتحان للطلاب الآن؟ مش هتعرف تعدّل الأسئلة بعد النشر.',
      close: 'إغلاق الامتحان؟ الطلاب مش هيقدروا يفتحوا محاولته تاني.',
      'show-results': 'نشر النتائج لكل الطلاب؟ هتظهر درجاتهم فورًا.',
      'hide-results': null,
    };
    const message = confirms[action];
    if (message && !window.confirm(message)) return;
    setBusy(action);
    setError('');
    try {
      await api(`/api/professor/exams/${examId}/publish`, { method: 'POST', body: JSON.stringify({ action }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function deleteExam() {
    if (!window.confirm('حذف الامتحان نهائيًا؟ متاح فقط للمسودات.')) return;
    setBusy('delete');
    try {
      await api(`/api/professor/exams/${examId}`, { method: 'DELETE' });
      router.push('/professor/exams');
    } catch (err) {
      setError((err as Error).message);
      setBusy('');
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!window.confirm('حذف هذا السؤال؟')) return;
    setBusy(`q-${questionId}`);
    try {
      await api(`/api/professor/exams/${examId}/questions/${questionId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  function exportCsv() {
    if (!attemptsData) return;
    const header = ['الكود', 'الاسم', 'الجروب', 'الحالة', 'الدرجة', 'من', 'وقت التسليم'];
    const rows = attemptsData.attempts.map((attempt) => [
      attempt.student.studentCode ?? '',
      attempt.student.name,
      attempt.student.group ?? '',
      attempt.status,
      attempt.score ?? '',
      attempt.maxScore ?? attemptsData.exam.totalMarks,
      attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('ar-EG') : '',
    ]);
    downloadBlob(
      `exam-${attemptsData.exam.id.slice(0, 8)}-results.csv`,
      'text/csv;charset=utf-8',
      toCSV([header, ...rows]),
    );
  }

  const exam = detail?.exam;
  const isDraft = exam?.status === 'DRAFT';

  return (
    <DashboardShell>
      <EmergencyBanner />
      {/* ═══ الترويسة + دورة الحياة ═══ */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/professor/exams" className="flex items-center gap-1 text-xs font-bold text-ink-400 transition hover:text-ink-700">
            <ArrowRight className="h-3.5 w-3.5" /> كل الامتحانات
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink-950">{exam?.title ?? '…'}</h1>
            {exam ? (
              <span className={cn('rounded-lg border px-2 py-1 text-[10px] font-extrabold', STATUS_CHIP[exam.status])}>
                {STATUS_LABEL[exam.status]}{exam.resultsVisible ? ' · النتائج منشورة' : ''}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {exam?.course.code} — {exam?.course.name} · {exam?.totalMarks} درجة · {exam?.durationMinutes} دقيقة
            {exam?.startsAt ? ` · يفتح ${new Date(exam.startsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDraft ? (
            <>
              <Button onClick={() => void lifecycle('publish')} disabled={busy !== ''}>
                {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                نشر الامتحان
              </Button>
              <Button variant="danger" onClick={() => void deleteExam()} disabled={busy !== ''}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </>
          ) : (
            <>
              {exam?.status === 'PUBLISHED' ? (
                <Button variant="outline" onClick={() => void lifecycle('close')} disabled={busy !== ''}>
                  <Lock className="h-4 w-4" />
                  إغلاق الامتحان
                </Button>
              ) : null}
              {exam?.resultsVisible ? (
                <Button variant="outline" onClick={() => void lifecycle('hide-results')} disabled={busy !== ''}>
                  <EyeOff className="h-4 w-4" />
                  إخفاء النتائج
                </Button>
              ) : (
                <Button onClick={() => void lifecycle('show-results')} disabled={busy !== ''}>
                  {busy === 'show-results' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  نشر النتائج
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="py-4 text-sm font-semibold text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
      ) : detail ? (
        <div className="grid gap-6 xl:grid-cols-5">
          {/* ═══════════ الأسئلة ═══════════ */}
          <Card className="xl:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PencilLine className="h-4 w-4 text-gold-700" />
                الأسئلة ({detail.questions.length})
              </CardTitle>
              <span className="text-[10px] font-semibold text-ink-400">
                {isDraft ? 'مسودة — التعديل متاح' : 'منشور — للقراءة فقط'}
              </span>
            </CardHeader>
            <CardContent className="grid gap-3">
              {detail.questions.length === 0 && !isDraft ? (
                <p className="py-6 text-center text-sm text-ink-400">لا توجد أسئلة.</p>
              ) : null}
              {detail.questions.map((question) => {
                const options = parseJson(question.options);
                const accepted = parseJson(question.acceptedAnswers);
                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-brand-900/10 bg-white/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink-900/[0.06] font-mono text-[10px] font-bold text-ink-600">
                          {question.ord}
                        </span>
                        <div className="min-w-0">
                          <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[8.5px] font-extrabold', KIND_CHIP[question.kind])}>
                            {KIND_LABEL[question.kind]} · {question.marks} درجة
                          </span>
                          <p className="mt-1 whitespace-pre-wrap text-[12px] font-semibold leading-relaxed text-ink-900">
                            {question.prompt}
                          </p>
                          {question.kind === 'MCQ' ? (
                            <ul className="mt-1.5 grid gap-0.5 text-[10px] text-ink-500">
                              {options.map((option, index) => (
                                <li key={index} className={cn(question.correctIndex === index && 'font-bold text-emerald-700')}>
                                  {question.correctIndex === index ? '✓ ' : '• '}{option}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {question.kind === 'TRUE_FALSE' ? (
                            <p className="mt-1 text-[10px] font-bold text-emerald-700">
                              الإجابة: {question.correctIndex === 0 ? 'صح' : 'خطأ'}
                            </p>
                          ) : null}
                          {question.kind === 'SHORT' && accepted.length > 0 ? (
                            <p className="mt-1 text-[10px] text-ink-500">
                              مقبول: <b className="text-ink-700">{accepted.join(' · ')}</b>
                            </p>
                          ) : null}
                          {question.kind === 'ESSAY' && question.rubric ? (
                            <p className="mt-1 line-clamp-2 text-[10px] italic text-ink-400">نموذج الإجابة: {question.rubric}</p>
                          ) : null}
                        </div>
                      </div>
                      {isDraft ? (
                        <button
                          type="button"
                          onClick={() => void deleteQuestion(question.id)}
                          disabled={busy === `q-${question.id}`}
                          aria-label="حذف السؤال"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-300 transition hover:bg-rose-500/10 hover:text-rose-600"
                        >
                          {busy === `q-${question.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {isDraft ? <AddQuestionForm examId={examId} onAdded={load} /> : null}
            </CardContent>
          </Card>

          {/* ═══════════ المحاولات والتصحيح ═══════════ */}
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-gold-700" />
                المحاولات ({attemptsData?.attempts.length ?? 0})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!attemptsData || attemptsData.attempts.length === 0}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2">
              {attemptsData && attemptsData.attempts.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-400">
                  لا توجد محاولات بعد — هتلاقي هنا كل تسليم لحظة بلحظة.
                </p>
              ) : null}
              {attemptsData?.attempts.map((attempt) => {
                const open = expandedAttempt === attempt.id;
                const isSubmitted = attempt.status !== 'IN_PROGRESS';
                const essayLeft = (attemptsData.questions ?? [])
                  .filter((q) => q.kind === 'ESSAY')
                  .filter((q) => !attempt.answers.some((a) => a.questionId === q.id && a.awardedMarks !== null)).length;
                return (
                  <div key={attempt.id} className="overflow-hidden rounded-2xl border border-brand-900/10">
                    <button
                      type="button"
                      onClick={() => setExpandedAttempt(open ? null : attempt.id)}
                      className="flex w-full items-center justify-between gap-2 bg-white/70 px-3 py-2.5 text-right transition hover:bg-gold-500/[0.06]"
                      aria-expanded={open}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-bold text-ink-900">
                          {attempt.student.name}
                          <span className="ms-1 font-normal text-ink-400">{attempt.student.studentCode}</span>
                        </p>
                        <p className="text-[9px] text-ink-400">
                          {attempt.status === 'IN_PROGRESS' ? 'جارٍ الحل الآن…' : attempt.status === 'SUBMITTED' ? 'بانتظار تصحيح المقالي' : 'مصحح ✓'}
                          {attempt.submittedAt ? ` · ${new Date(attempt.submittedAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[11px] font-extrabold text-ink-800">
                          {attempt.score === null ? '—' : `${attempt.score}/${attempt.maxScore ?? attemptsData.exam.totalMarks}`}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 text-ink-300 transition-transform', open && 'rotate-180')} />
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t border-brand-900/10 bg-gold-500/[0.04] p-3">
                        {!isSubmitted ? (
                          <p className="text-[11px] text-ink-500">الطالب لم يسلّم بعد.</p>
                        ) : (
                          <AttemptGrader examId={examId} attempt={attempt} questions={attemptsData.questions} onSaved={load} />
                        )}
                        {essayLeft > 0 && isSubmitted ? (
                          <p className="mt-2 text-[9px] font-bold text-amber-700">{essayLeft} سؤال مقالي بانتظار تصحيحك.</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DashboardShell>
  );
}

/* ═══════════════ نموذج إضافة سؤال ═══════════════ */
function AddQuestionForm({ examId, onAdded }: { examId: string; onAdded: () => Promise<void> }) {
  const [kind, setKind] = React.useState<QuestionKind>('MCQ');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const prompt = String(form.get('prompt') || '').trim();
    const marks = Number(form.get('marks') || 1);
    let payload: Record<string, unknown>;
    if (kind === 'MCQ') {
      const options = [0, 1, 2, 3, 4, 5]
        .map((i) => String(form.get(`option-${i}`) || '').trim())
        .filter(Boolean);
      payload = { kind, prompt, marks, options, correctIndex: Number(form.get('correctIndex') || 0) };
    } else if (kind === 'TRUE_FALSE') {
      payload = { kind, prompt, marks, correctIndex: Number(form.get('tfAnswer') || 0) };
    } else if (kind === 'SHORT') {
      const acceptedAnswers = String(form.get('acceptedAnswers') || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      payload = { kind, prompt, marks, acceptedAnswers };
    } else {
      payload = {
        kind: 'ESSAY',
        prompt,
        marks,
        rubric: String(form.get('rubric') || '').trim() || undefined,
      };
    }
    try {
      await api(`/api/professor/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(payload) });
      (event.currentTarget as HTMLFormElement).reset();
      setKind('MCQ');
      await onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-dashed border-gold-400/40 bg-gold-500/[0.05] p-3">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-gold-800">
        <Plus className="h-4 w-4" /> إضافة سؤال
      </p>
      <div className="flex flex-wrap gap-2">
        {(['MCQ', 'TRUE_FALSE', 'SHORT', 'ESSAY'] as QuestionKind[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            aria-pressed={kind === option}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition',
              kind === option
                ? 'border-gold-500/50 bg-gold-500/15 text-gold-900 ring-1 ring-gold-500/40'
                : 'border-brand-900/10 bg-white/70 text-ink-500 hover:text-ink-900',
            )}
          >
            {KIND_LABEL[option]}
          </button>
        ))}
      </div>
      <textarea
        name="prompt"
        required
        rows={2}
        placeholder="نص السؤال…"
        className="mt-2 w-full rounded-xl border border-brand-900/10 bg-white/80 p-3 text-xs leading-relaxed outline-none focus:border-gold-500/40"
        aria-label="نص السؤال"
      />
      {kind === 'MCQ' ? (
        <div className="mt-2 grid gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <label key={i} className="flex items-center gap-2 text-[10px]">
              <input type="radio" name="correctIndex" value={i} defaultChecked={i === 0} className="accent-[#c88e1b]" aria-label={`الإجابة الصحيحة: الاختيار ${i + 1}`} />
              <input
                name={`option-${i}`}
                placeholder={`الاختيار ${i + 1}${i < 2 ? ' (إجباري)' : ' (اختياري)'}`}
                required={i < 2}
                className="h-8 w-full rounded-lg border border-brand-900/10 bg-white/80 px-2 text-[10px] outline-none"
              />
            </label>
          ))}
          <p className="text-[9px] text-ink-400">الدائرة = الإجابة الصحيحة. اختياران على الأقل، ستة كحد أقصى.</p>
        </div>
      ) : null}
      {kind === 'TRUE_FALSE' ? (
        <select name="tfAnswer" className="mt-2 h-9 w-full rounded-lg border border-brand-900/10 bg-white/80 px-2 text-xs" defaultValue="0">
          <option value="0">الإجابة: صح</option>
          <option value="1">الإجابة: خطأ</option>
        </select>
      ) : null}
      {kind === 'SHORT' ? (
        <textarea
          name="acceptedAnswers"
          required
          rows={2}
          placeholder={'الإجابات المقبولة — إجابة في كل سطر\nمثال:\nنيوتن\nNewton'}
          className="mt-2 w-full rounded-xl border border-brand-900/10 bg-white/80 p-2 text-[10px] leading-relaxed outline-none"
          aria-label="الإجابات المقبولة"
        />
      ) : null}
      {kind === 'ESSAY' ? (
        <textarea
          name="rubric"
          rows={2}
          placeholder="نموذج الإجابة / معايير التقييم (للدكتور فقط — الطالب لا يراها)"
          className="mt-2 w-full rounded-xl border border-brand-900/10 bg-white/80 p-2 text-[10px] leading-relaxed outline-none"
          aria-label="نموذج الإجابة"
        />
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <Label htmlFor={`marks-${examId}`} className="text-[10px] font-bold">الدرجة</Label>
        <Input id={`marks-${examId}`} name="marks" type="number" min={0.5} step={0.5} max={100} defaultValue={kind === 'ESSAY' ? 10 : 1} className="h-8 w-20" required />
        <Button type="submit" size="sm" disabled={saving} className="ms-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          حفظ السؤال
        </Button>
      </div>
      {error ? <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </form>
  );
}

/* ═══════════════ مصحح المقالي داخل المحاولة ═══════════════ */
function AttemptGrader({
  examId,
  attempt,
  questions,
  onSaved,
}: {
  examId: string;
  attempt: AttemptRow;
  questions: AttemptsResponse['questions'];
  onSaved: () => Promise<void>;
}) {
  const essayQuestions = questions.filter((question) => question.kind === 'ESSAY');
  const [marks, setMarks] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const question of essayQuestions) {
      const answer = attempt.answers.find((item) => item.questionId === question.id);
      if (answer?.awardedMarks !== null && answer?.awardedMarks !== undefined) {
        initial[question.id] = String(answer.awardedMarks);
      }
    }
    return initial;
  });
  const [feedback, setFeedback] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const answer of attempt.answers) {
      if (answer.feedback) initial[answer.questionId] = answer.feedback;
    }
    return initial;
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function save() {
    setSaving(true);
    setError('');
    const payload = essayQuestions
      .filter((question) => marks[question.id] !== undefined && marks[question.id] !== '')
      .map((question) => ({
        questionId: question.id,
        awardedMarks: Math.min(question.marks, Math.max(0, Number(marks[question.id]) || 0)),
        feedback: feedback[question.id]?.trim() || undefined,
      }));
    if (payload.length === 0) {
      setSaving(false);
      return;
    }
    try {
      await api(`/api/professor/exams/${examId}/attempts`, {
        method: 'PATCH',
        body: JSON.stringify({ attemptId: attempt.id, answers: payload }),
      });
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      {essayQuestions.map((question) => {
        const answer = attempt.answers.find((item) => item.questionId === question.id);
        return (
          <div key={question.id} className="rounded-xl border border-brand-900/10 bg-white/70 p-2.5">
            <p className="text-[10px] font-bold text-ink-800">
              مقالي {question.ord} · {question.marks} درجة
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-[10.5px] font-semibold text-ink-900">{question.prompt}</p>
            {question.rubric ? (
              <p className="mt-1 rounded-lg bg-gold-500/[0.08] px-2 py-1 text-[9px] italic text-gold-900">
                نموذج: {question.rubric}
              </p>
            ) : null}
            <div className="mt-1.5 rounded-lg border border-brand-900/10 bg-white/80 p-2 text-[10.5px] leading-relaxed text-ink-800">
              {answer?.answerText ? (
                <span className="whitespace-pre-wrap">{answer.answerText}</span>
              ) : (
                <span className="italic text-ink-400">— لم يجب —</span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                max={question.marks}
                step={0.5}
                value={marks[question.id] ?? ''}
                onChange={(event) => setMarks((prev) => ({ ...prev, [question.id]: event.target.value }))}
                placeholder="الدرجة"
                aria-label={`درجة المقالي ${question.ord}`}
                className="h-8 w-20 rounded-lg border border-brand-900/15 bg-white/90 px-2 text-center font-latin text-[10px] font-bold outline-none focus:border-gold-500/50"
              />
              <span className="text-[9px] text-ink-400">/ {question.marks}</span>
              <input
                value={feedback[question.id] ?? ''}
                onChange={(event) => setFeedback((prev) => ({ ...prev, [question.id]: event.target.value }))}
                placeholder="ملاحظة للطالب (اختياري)…"
                aria-label="ملاحظتك للطالب"
                className="h-8 min-w-0 flex-1 rounded-lg border border-brand-900/15 bg-white/90 px-2 text-[10px] outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
        );
      })}
      {essayQuestions.length === 0 ? (
        <p className="flex items-center gap-2 text-[10.5px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> لا توجد أسئلة مقالية — التصحيح آلي بالكامل.
        </p>
      ) : (
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          حفظ التصحيح
        </Button>
      )}
      {error ? <p className="text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
