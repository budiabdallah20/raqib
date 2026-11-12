'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  FileText,
  Loader2,
  Plus,
  Users,
  X,
} from 'lucide-react';
import EmergencyBanner from '@/components/shared/EmergencyBanner';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type CourseOption = { id: string; code: string; name: string };

type ExamRow = {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
  totalMarks: number;
  resultsVisible: boolean;
  courseId: string;
  questions: number;
  attempts: number;
  course: CourseOption | null;
};

const STATUS: Record<ExamRow['status'], { label: string; cls: string }> = {
  DRAFT: { label: 'مسودة', cls: 'border-ink-300 bg-ink-900/[0.06] text-ink-600' },
  PUBLISHED: { label: 'منشور', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  CLOSED: { label: 'مغلق', cls: 'border-ink-400 bg-ink-900/[0.10] text-ink-600' },
};

export default function ProfessorExamsPage() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<CourseOption[]>([]);
  const [exams, setExams] = React.useState<ExamRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await api<{ courses: CourseOption[]; exams: ExamRow[] }>('/api/professor/exams');
      setCourses(data.courses);
      setExams(data.exams);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function createExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get('startsAt') || '').trim();
    const endsAt = String(form.get('endsAt') || '').trim();
    try {
      const data = await api<{ ok: true; exam: { id: string } }>('/api/professor/exams', {
        method: 'POST',
        body: JSON.stringify({
          courseId: form.get('courseId'),
          title: form.get('title'),
          instructions: String(form.get('instructions') || '').trim() || undefined,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          durationMinutes: Number(form.get('durationMinutes') || 60),
        }),
      });
      router.push(`/professor/exams/${data.exam.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <DashboardShell>
      <EmergencyBanner />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-gold-700">
            <BookOpenCheck className="h-4 w-4" /> Exam Studio — استوديو الامتحانات
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">الامتحانات الإلكترونية</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            MCQ · صح/خطأ · إجابة قصيرة (تصحيح حتمي) · مقالي (يراجعه الدكتور قبل النشر).
            النتائج لا تظهر للطلاب إلا لما تضغط «نشر النتائج».
          </p>
        </div>
        <Button onClick={() => setCreateOpen((v) => !v)}>
          {createOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {createOpen ? 'إغلاق' : 'امتحان جديد'}
        </Button>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="py-4 text-sm font-semibold text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      {createOpen ? (
        <Card className="mb-6 border-gold-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-gold-700" /> امتحان جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={createExam} className="grid gap-4 md:grid-cols-2">
              <FormField>
                <Label htmlFor="courseId">المقرر</Label>
                <select
                  id="courseId"
                  name="courseId"
                  required
                  className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm"
                >
                  <option value="">اختر المقرر</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="title">عنوان الامتحان</Label>
                <Input id="title" name="title" required minLength={3} placeholder="كويز 3 — المشتقات" />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="instructions">تعليمات (اختياري)</Label>
                <Input id="instructions" name="instructions" placeholder="يُمنع فتح أي مرجع — المدة 60 دقيقة" />
              </FormField>
              <FormField>
                <Label htmlFor="startsAt">موعد الفتح (اختياري)</Label>
                <Input id="startsAt" name="startsAt" type="datetime-local" />
              </FormField>
              <FormField>
                <Label htmlFor="endsAt">موعد الإغلاق (اختياري)</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" />
              </FormField>
              <FormField>
                <Label htmlFor="durationMinutes">المدة بالدقائق</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" min={5} max={240} defaultValue={60} required />
              </FormField>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                  إنشاء والانتقال للأسئلة
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpenCheck className="h-10 w-10 text-ink-300" />
            <p className="font-display text-lg font-bold text-ink-800">لا توجد امتحانات بعد</p>
            <p className="max-w-md text-sm text-ink-500">
              اضغط «امتحان جديد» — هتلاقي بعد الإنشاء صفحة كاملة لإضافة الأسئلة وتعيين مفتاح الإجابة.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => {
            const status = STATUS[exam.status];
            return (
              <Link key={exam.id} href={`/professor/exams/${exam.id}`} className="group">
                <Card className="h-full transition hover:border-gold-400/40 hover:shadow-gold-soft">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-[10px] font-bold text-gold-700">
                          {exam.course?.code} · {exam.totalMarks} درجة
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink-950 group-hover:text-gold-900" title={exam.title}>
                          {exam.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-400">{exam.course?.name}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-lg border px-2 py-1 text-[9px] font-extrabold', status.cls)}>
                        {status.label}
                        {exam.resultsVisible ? ' · نُشرت النتائج' : ''}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-ink-500">
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{exam.questions} سؤال</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam.attempts} محاولة</span>
                      <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{exam.durationMinutes} دقيقة</span>
                    </div>
                    {exam.startsAt ? (
                      <p className="mt-2 text-[9.5px] text-ink-400">
                        {new Date(exam.startsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        {exam.endsAt ? ` ← ${new Date(exam.endsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    ) : (
                      <p className="mt-2 text-[9.5px] text-ink-400">بدون نافذة نشر — يفتح بقرارك يدويًا</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
