'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Send,
  Timer,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type QuestionKind = 'MCQ' | 'TRUE_FALSE' | 'SHORT' | 'ESSAY';

type Question = {
  id: string;
  ord: number;
  kind: QuestionKind;
  prompt: string;
  marks: number;
  options: string[] | null;
};

type StartResponse = {
  attempt: { id: string; status: string; startedAt: string; deadline: string };
  exam: { id: string; title: string; professor: string; durationMinutes: number };
  questions: Question[];
  draftAnswers: { questionId: string; selectedIndex: number | null; answerText: string | null }[];
};

type AnswerMap = Record<string, { selectedIndex?: number | null; answerText?: string | null }>;

export default function StudentTakeExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;

  const [phase, setPhase] = React.useState<'loading' | 'taking' | 'done' | 'error'>('loading');
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState<StartResponse | null>(null);
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const answersRef = React.useRef<AnswerMap>({});
  const pendingDraft = React.useRef<AnswerMap>({});
  const [draftVersion, setDraftVersion] = React.useState(0);
  const [remainingSec, setRemainingSec] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveQueue = React.useRef<Promise<unknown>>(Promise.resolve());

  // بدء/استئناف المحاولة عند فتح الصفحة (idempotent على الخادم)
  React.useEffect(() => {
    let cancelled = false;
    api<StartResponse>('/api/student/exams/start', { method: 'POST', body: JSON.stringify({ examId }) })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        const restored = Object.fromEntries((result.draftAnswers ?? []).map((answer) => [
          answer.questionId,
          { selectedIndex: answer.selectedIndex, answerText: answer.answerText },
        ]));
        answersRef.current = restored;
        pendingDraft.current = {};
        setAnswers(restored);
        setPhase('taking');
        const deadline = new Date(result.attempt.deadline).getTime();
        setRemainingSec(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error).message);
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  // العدّاد
  React.useEffect(() => {
    if (phase !== 'taking') return;
    const t = setInterval(() => {
      setRemainingSec((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Debounced, serialized server saves. A newer edit always follows an older request.
  React.useEffect(() => {
    if (phase !== 'taking' || !data || Object.keys(pendingDraft.current).length === 0 || submitting) return;
    setSaveState('saving');
    let cancelled = false;
    const timer = setTimeout(() => {
      const payload = Object.entries(pendingDraft.current).map(([questionId, answer]) => ({ questionId, ...answer }));
      pendingDraft.current = {};
      saveQueue.current = saveQueue.current.catch(() => undefined).then(() =>
        api('/api/student/exams/draft', {
          method: 'POST',
          body: JSON.stringify({ attemptId: data.attempt.id, answers: payload }),
        }),
      );
      saveQueue.current.then(
        () => { if (!cancelled) setSaveState('saved'); },
        () => {
          for (const answer of payload) {
            pendingDraft.current[answer.questionId] ??= answer;
          }
          if (!cancelled) setSaveState('error');
        },
      );
    }, 1200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [draftVersion, data, phase, submitting]);

  // تحذير قبل مغادرة الصفحة أثناء الامتحان
  React.useEffect(() => {
    if (phase !== 'taking') return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const submittingRef = React.useRef(false);
  const submit = React.useCallback(
    async (auto = false) => {
      if (!data || submittingRef.current) return;
      if (!auto && !window.confirm('تسليم نهائي؟ مش هتقدر تعدّل إجاباتك بعد كده.')) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        await api('/api/student/exams/submit', {
          method: 'POST',
          body: JSON.stringify({
            attemptId: data.attempt.id,
            answers: Object.entries(answersRef.current).map(([questionId, answer]) => ({
              questionId,
              selectedIndex: answer.selectedIndex ?? null,
              answerText: answer.answerText ?? null,
            })),
          }),
        });
        setPhase('done');
      } catch (err) {
        submittingRef.current = false;
        setError((err as Error).message);
        setSubmitting(false);
      }
    },
    [data],
  );

  // التسليم التلقائي عند انتهاء الوقت
  React.useEffect(() => {
    if (phase === 'taking' && remainingSec === 0 && data) {
      void submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingSec === 0]);

  function setAnswer(questionId: string, patch: Partial<{ selectedIndex: number | null; answerText: string | null }>) {
    const next = { ...answersRef.current[questionId], ...patch };
    answersRef.current = { ...answersRef.current, [questionId]: next };
    pendingDraft.current[questionId] = next;
    setAnswers(answersRef.current);
    setDraftVersion((version) => version + 1);
  }

  const answeredCount = data
    ? data.questions.filter((q) => {
        const a = answers[q.id];
        if (!a) return false;
        if (q.kind === 'MCQ' || q.kind === 'TRUE_FALSE') return a.selectedIndex !== null && a.selectedIndex !== undefined;
        return Boolean(a.answerText?.trim());
      }).length
    : 0;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const danger = remainingSec <= 60;

  return (
    <StudentShell>
      {phase === 'loading' ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
        </div>
      ) : phase === 'error' ? (
        <Card className="mx-auto max-w-lg border-rose-500/30">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <p className="font-display font-bold text-ink-900">{error || 'تعذر فتح الامتحان'}</p>
            <Button variant="outline" onClick={() => router.push('/student/exams')}>
              <ChevronLeft className="h-4 w-4" />
              رجوع للامتحانات
            </Button>
          </CardContent>
        </Card>
      ) : phase === 'done' ? (
        <Card className="mx-auto max-w-lg border-emerald-500/30">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <h1 className="font-display text-xl font-bold text-ink-950">تم استلام تسليمك 🎉</h1>
            <p className="max-w-sm text-sm leading-relaxed text-ink-500">
              إجاباتك محفوظة على الخادم. النتائج تنشر بقرار الدكتور — هتظهر هنا وفي إشعار فور ما تتفتح.
            </p>
            <Button onClick={() => router.push('/student/exams')}>عرض امتحاناتي ←</Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div>
          {/* شريط الامتحان اللاصق */}
          <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-gold-500/20 bg-[#f7faf7]/90 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-extrabold text-ink-950">{data.exam.title}</p>
                <p className="text-[10px] text-ink-500">د. {data.exam.professor} · أجبت {answeredCount} من {data.questions.length}</p>
                <p className="text-[10px] text-ink-500" role="status" aria-live="polite">
                  {saveState === 'saving' ? 'جارٍ حفظ الإجابات…' : saveState === 'saved' ? 'الإجابات محفوظة' : saveState === 'error' ? 'تعذر حفظ المسودة — جرّب التسليم أو تحقق من الاتصال' : 'الحفظ التلقائي مفعّل'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-11 items-center gap-1.5 rounded-xl border px-3 font-mono text-lg font-extrabold tabular-nums',
                    danger
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700'
                      : 'border-gold-500/30 bg-gold-500/[0.08] text-gold-800',
                  )}
                  role="timer"
                  aria-label="الوقت المتبقي"
                >
                  <Timer className="h-4 w-4" />
                  {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                </span>
                <Button onClick={() => void submit(false)} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  تسليم
                </Button>
              </div>
            </div>
          </div>

          <ol className="mx-auto grid max-w-4xl gap-4 pb-16">
            {data.questions.map((question) => (
              <li key={question.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 whitespace-pre-wrap text-[13px] font-bold leading-relaxed text-ink-950">
                        <span className="me-1 font-mono text-ink-400">{question.ord}.</span> {question.prompt}
                      </p>
                      <span className="shrink-0 rounded-lg border border-gold-500/25 bg-gold-500/[0.08] px-2 py-1 text-[10px] font-extrabold text-gold-800">
                        {question.marks} درجة
                      </span>
                    </div>

                    {question.kind === 'MCQ' && question.options ? (
                      <div className="mt-3 grid gap-2" role="radiogroup" aria-label="الاختيارات">
                        {question.options.map((option, index) => {
                          const selected = answers[question.id]?.selectedIndex === index;
                          return (
                            <label
                              key={index}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition',
                                selected
                                  ? 'border-gold-500/50 bg-gold-500/[0.12] text-gold-900 ring-1 ring-gold-500/40'
                                  : 'border-brand-900/10 bg-white/70 text-ink-700 hover:border-gold-400/40',
                              )}
                            >
                              <input
                                type="radio"
                                name={`q-${question.id}`}
                                className="accent-[#c88e1b]"
                                checked={selected}
                                onChange={() => setAnswer(question.id, { selectedIndex: index })}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : question.kind === 'TRUE_FALSE' && question.options ? (
                      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="صح أو خطأ">
                        {question.options.map((option, index) => {
                          const selected = answers[question.id]?.selectedIndex === index;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setAnswer(question.id, { selectedIndex: index })}
                              aria-pressed={selected}
                              className={cn(
                                'rounded-xl border px-4 py-3 font-display text-sm font-extrabold transition',
                                selected
                                  ? 'border-gold-500/50 bg-gold-500/[0.15] text-gold-900 ring-1 ring-gold-500/40'
                                  : 'border-brand-900/10 bg-white/70 text-ink-600 hover:border-gold-400/40',
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    ) : question.kind === 'SHORT' ? (
                      <Input
                        value={answers[question.id]?.answerText ?? ''}
                        onChange={(event) => setAnswer(question.id, { answerText: event.target.value })}
                        placeholder="إجابتك…"
                        className="mt-3"
                        aria-label="إجابتك القصيرة"
                      />
                    ) : (
                      <textarea
                        value={answers[question.id]?.answerText ?? ''}
                        onChange={(event) => setAnswer(question.id, { answerText: event.target.value })}
                        rows={5}
                        placeholder="اكتب إجابتك هنا…"
                        aria-label="إجابتك المقالية"
                        className="mt-3 w-full rounded-xl border border-brand-900/10 bg-white/80 p-3 text-[12px] leading-relaxed outline-none focus:border-gold-500/40"
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </StudentShell>
  );
}
