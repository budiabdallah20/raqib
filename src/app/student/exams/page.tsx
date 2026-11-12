'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  Play,
  RotateCcw,
  ScrollText,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { EmptyState } from '@/components/student/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type MyAttempt = {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string;
  submittedAt: string | null;
  deadline: string;
  score?: number | null;
  maxScore?: number | null;
};

type ExamRow = {
  id: string;
  title: string;
  instructions: string | null;
  status: 'PUBLISHED' | 'CLOSED';
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
  totalMarks: number;
  questions: number;
  resultsVisible: boolean;
  course: { id: string; code: string; name: string };
  inWindow: boolean;
  myAttempt: MyAttempt | null;
};

export default function StudentExamsPage() {
  const [exams, setExams] = React.useState<ExamRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api<{ exams: ExamRow[] }>('/api/student/exams')
      .then((data) => setExams(data.exams))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const available = exams.filter((exam) => exam.status === 'PUBLISHED' && !exam.myAttempt);
  const inProgress = exams.filter((exam) => exam.myAttempt?.status === 'IN_PROGRESS');
  const submitted = exams.filter((exam) => exam.myAttempt && exam.myAttempt.status !== 'IN_PROGRESS');

  return (
    <StudentShell>
      <div className="mb-6">
        <p className="flex items-center gap-2 text-xs font-bold text-gold-700">
          <BookOpenCheck className="h-4 w-4" /> امتحاناتك — بتواريخ محددة ونتائج بالأوقات المناسبة
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">امتحاناتي</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          الامتحان يفتح في موعده ويتقفل تلقائيًا، والمحاولة واحدة، والنتائج تتنشر بقرار الدكتور — زي الامتحان الرسمي بالضبط.
        </p>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          kind="grades"
          title="لا توجد امتحانات متاحة"
          sub="امتحانات مقرراتك هتظهر هنا لما ينشرها الدكتور — وهنبعتلك إشعار أول ما يحصل."
        />
      ) : (
        <div className="grid gap-6">
          {/* جارية الآن */}
          {inProgress.length > 0 ? (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-gold-800">
                <Clock3 className="h-4 w-4" /> محاولة جارية — كمّل قبل ما الوقت ينتهي!
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {inProgress.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} highlight />
                ))}
              </div>
            </section>
          ) : null}

          {/* جاهزة للبدء */}
          {available.length > 0 ? (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-ink-700">
                <ListChecks className="h-4 w-4" /> جاهزة للبدء
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {available.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </section>
          ) : null}

          {/* مسلمة */}
          {submitted.length > 0 ? (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> امتحانات سلّمتها
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {submitted.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </StudentShell>
  );
}

function ExamCard({ exam, highlight }: { exam: ExamRow; highlight?: boolean }) {
  const attempt = exam.myAttempt;
  const isInProgress = attempt?.status === 'IN_PROGRESS';
  const submitted = attempt && attempt.status !== 'IN_PROGRESS';
  const scoreVisible = exam.resultsVisible && submitted;

  return (
    <Card className={cn('overflow-hidden', highlight && 'border-gold-500/40 ring-1 ring-gold-500/40')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-[10px] font-bold text-gold-700">
              {exam.course.code} · {exam.totalMarks} درجة
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink-950" title={exam.title}>
              {exam.title}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-ink-400">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{exam.questions} سؤال</span>
              <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{exam.durationMinutes} دقيقة</span>
            </p>
          </div>
          {scoreVisible ? (
            <div className="shrink-0 text-center">
              <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">
                {attempt.score ?? '—'}
              </p>
              <p className="text-[8.5px] font-bold text-ink-400">من {attempt.maxScore ?? exam.totalMarks}</p>
            </div>
          ) : null}
        </div>

        <p className="mt-2 text-[9.5px] text-ink-400">
          {exam.startsAt
            ? `يفتح: ${new Date(exam.startsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
            : 'متاح بقرار الدكتور'}
          {exam.endsAt ? ` · يقفل: ${new Date(exam.endsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>

        <div className="mt-3">
          {isInProgress ? (
            <Link href={`/student/exams/${exam.id}`} className="block">
              <Button className="w-full">
                <RotateCcw className="h-4 w-4" />
                استأنف المحاولة
                <span className="text-[10px] opacity-80">(حتى {new Date(attempt.deadline).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})</span>
              </Button>
            </Link>
          ) : submitted && scoreVisible ? (
            <Link href={`/student/exams/${exam.id}/review`} className="block">
              <Button variant="outline" className="w-full">
                <ScrollText className="h-4 w-4" />
                مراجعة التصحيح والتفاصيل
              </Button>
            </Link>
          ) : submitted ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] py-2 text-[11px] font-bold text-brand-800">
              <CheckCircle2 className="h-4 w-4" /> تم التسليم — النتائج تنشر بقرار الدكتور
            </p>
          ) : !exam.inWindow ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-ink-900/[0.05] py-2 text-[11px] font-bold text-ink-500">
              <Clock3 className="h-4 w-4" /> لم يفتح بعد
            </p>
          ) : (
            <Link href={`/student/exams/${exam.id}`} className="block">
              <Button className="w-full">
                <Play className="h-4 w-4" />
                ابدأ الامتحان
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
