'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MinusCircle,
  ScrollText,
  XCircle,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type QuestionKind = 'MCQ' | 'TRUE_FALSE' | 'SHORT' | 'ESSAY';

type ReviewResponse = {
  exam: { id: string; title: string; totalMarks: number };
  attempt: {
    id: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    submittedAt: string | null;
  };
  questions: {
    id: string;
    ord: number;
    kind: QuestionKind;
    prompt: string;
    marks: number;
    options: string[] | null;
    correctIndex: number | null;
    acceptedAnswers?: string[];
    rubric: string | null;
    myAnswer: {
      selectedIndex: number | null;
      answerText: string | null;
      awardedMarks: number | null;
      isCorrect: boolean | null;
      feedback: string | null;
      gradedBy: string | null;
    } | null;
  }[];
};

const KIND_LABEL: Record<QuestionKind, string> = {
  MCQ: 'اختيار من متعدد',
  TRUE_FALSE: 'صح / خطأ',
  SHORT: 'إجابة قصيرة',
  ESSAY: 'مقالي',
};

export default function StudentExamReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const examId = params.id;

  const [data, setData] = React.useState<ReviewResponse | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api<ReviewResponse>(`/api/student/exams/review?examId=${encodeURIComponent(examId)}`)
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <StudentShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
        </div>
      </StudentShell>
    );
  }

  if (error || !data) {
    return (
      <StudentShell>
        <Card className="mx-auto max-w-lg border-amber-500/30">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ScrollText className="h-8 w-8 text-amber-500" />
            <p className="font-display font-bold text-ink-900">{error || 'النتائج غير متاحة'}</p>
            <Button variant="outline" onClick={() => router.push('/student/exams')}>
              <ArrowRight className="h-4 w-4" />
              رجوع للامتحانات
            </Button>
          </CardContent>
        </Card>
      </StudentShell>
    );
  }

  const score = data.attempt.score ?? 0;
  const maxScore = data.attempt.maxScore ?? data.exam.totalMarks;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <StudentShell>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/student/exams')}
          className="flex items-center gap-1 text-xs font-bold text-ink-400 transition hover:text-ink-700"
        >
          <ArrowRight className="h-3.5 w-3.5" /> امتحاناتي
        </button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-950">{data.exam.title}</h1>
            <p className="mt-0.5 text-xs text-ink-500">
              سلّمتها في {data.attempt.submittedAt ? new Date(data.attempt.submittedAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gold-500/30 bg-gold-500/[0.08] px-5 py-3">
            <div className="text-center">
              <p className="font-display text-4xl font-extrabold tabular-nums text-ink-950">{score}</p>
              <p className="text-[9px] font-bold text-ink-400">من {maxScore} · {pct}%</p>
            </div>
          </div>
        </div>
      </div>

      <ol className="grid gap-4">
        {data.questions.map((question) => {
          const answer = question.myAnswer;
          const awarded = answer?.awardedMarks;
          const state =
            awarded === null || awarded === undefined
              ? 'pending'
              : awarded >= question.marks
                ? 'full'
                : awarded > 0
                  ? 'partial'
                  : 'zero';
          return (
            <li key={question.id}>
              <Card className={cn(
                'border-r-4',
                state === 'full' && 'border-r-emerald-500',
                state === 'partial' && 'border-r-amber-500',
                state === 'zero' && 'border-r-rose-500',
                state === 'pending' && 'border-r-ink-300',
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-ink-400">
                        سؤال {question.ord} · {KIND_LABEL[question.kind]} · {question.marks} درجة
                      </span>
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] font-bold leading-relaxed text-ink-950">
                        {question.prompt}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-extrabold',
                        state === 'full' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
                        state === 'partial' && 'border-amber-500/30 bg-amber-500/10 text-amber-800',
                        state === 'zero' && 'border-rose-500/30 bg-rose-500/10 text-rose-700',
                        state === 'pending' && 'border-ink-200 bg-ink-900/[0.05] text-ink-500',
                      )}
                    >
                      {state === 'full' ? <CheckCircle2 className="h-3.5 w-3.5" /> : state === 'zero' ? <XCircle className="h-3.5 w-3.5" /> : <MinusCircle className="h-3.5 w-3.5" />}
                      {awarded === null || awarded === undefined ? 'بانتظار التصحيح' : `${awarded}/${question.marks}`}
                    </span>
                  </div>

                  {/* إجابتك */}
                  <div className="mt-2 rounded-xl border border-brand-900/10 bg-white/70 p-3 text-[11px] leading-relaxed text-ink-800">
                    <p className="text-[9px] font-extrabold text-ink-400">إجابتك:</p>
                    {question.kind === 'MCQ' || question.kind === 'TRUE_FALSE' ? (
                      <p className="mt-0.5">
                        {answer?.selectedIndex !== null && answer?.selectedIndex !== undefined && question.options
                          ? question.options[answer.selectedIndex]
                          : <span className="italic text-ink-400">— بلا إجابة —</span>}
                      </p>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-wrap">{answer?.answerText?.trim() ? answer.answerText : <span className="italic text-ink-400">— بلا إجابة —</span>}</p>
                    )}
                  </div>

                  {/* المفتاح / نموذج الإجابة */}
                  <div className="mt-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-[11px] leading-relaxed text-emerald-900">
                    <p className="text-[9px] font-extrabold text-emerald-700/80">
                      {question.kind === 'ESSAY' ? 'نموذج إجابة الدكتور:' : 'الإجابة الصحيحة:'}
                    </p>
                    {question.kind === 'MCQ' || question.kind === 'TRUE_FALSE' ? (
                      <p className="mt-0.5">
                        {question.correctIndex !== null && question.options ? question.options[question.correctIndex] : '—'}
                      </p>
                    ) : question.kind === 'SHORT' ? (
                      <p className="mt-0.5">{question.acceptedAnswers?.join(' · ')}</p>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-wrap italic">{question.rubric ?? '—'}</p>
                    )}
                  </div>

                  {answer?.feedback ? (
                    <p className="mt-1.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-[10.5px] leading-relaxed text-violet-900">
                      <b>ملاحظة الدكتور:</b> {answer.feedback}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </StudentShell>
  );
}
