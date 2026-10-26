'use client';

import * as React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Course = { id: string; name: string; code: string };
type Submission = {
  id: string;
  studentId: string;
  fileUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  student: { name: string; studentCode: string | null };
};
type ProfessorTask = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  deadline: string;
  requiresFile: boolean;
  status: string;
  course: { id: string; code: string; name: string };
  _count?: { submissions: number };
  submissions?: Submission[];
};

type Draft = { score: string; feedback: string; status: 'idle' | 'saving' | 'saved' | 'error' };

export default function ProfessorTasksPage() {
  const [tasks, setTasks] = React.useState<ProfessorTask[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [now, setNow] = React.useState(() => Date.now());

  const load = React.useCallback(async () => {
    const [t, c] = await Promise.all([
      api<{ tasks: ProfessorTask[] }>('/api/tasks/manage'),
      api<{ courses: Course[] }>('/api/courses'),
    ]);
    setTasks(t.tasks);
    setCourses(c.courses);
  }, []);

  React.useEffect(() => {
    load().catch((err) => setError((err as Error).message));
    const ticker = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(ticker);
  }, [load]);

  function keyOf(taskId: string, studentId: string) {
    return `${taskId}:${studentId}`;
  }

  function openTask(task: ProfessorTask) {
    setError('');
    if (openId === task.id) {
      setOpenId(null);
      return;
    }
    const next: Record<string, Draft> = {};
    for (const sub of task.submissions || []) {
      next[keyOf(task.id, sub.studentId)] = {
        score: sub.score === null || sub.score === undefined ? '' : String(sub.score),
        feedback: sub.feedback || '',
        status: 'idle',
      };
    }
    setDrafts(next);
    setOpenId(task.id);
  }

  function updateDraft(taskId: string, studentId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [keyOf(taskId, studentId)]: { ...(prev[keyOf(taskId, studentId)] || { score: '', feedback: '', status: 'idle' }), ...patch },
    }));
  }

  function getDraft(taskId: string, studentId: string): Draft {
    return drafts[keyOf(taskId, studentId)] || { score: '', feedback: '', status: 'idle' };
  }

  async function saveScore(task: ProfessorTask, studentId: string) {
    const draft = getDraft(task.id, studentId);
    const score = Number(draft.score);
    if (draft.score.trim() === '' || !Number.isFinite(score) || score < 0 || score > 100) {
      setError('الدرجة يجب أن تكون رقمًا بين 0 و 100');
      updateDraft(task.id, studentId, { status: 'error' });
      return;
    }
    setError('');
    updateDraft(task.id, studentId, { status: 'saving' });
    try {
      const data = await api<{ graded: number }>('/api/tasks/manage', {
        method: 'PUT',
        body: JSON.stringify({
          taskId: task.id,
          rows: [{ studentId, score, feedback: draft.feedback }],
        }),
      });
      if (data.graded > 0) updateDraft(task.id, studentId, { status: 'saved' });
    } catch (err) {
      setError((err as Error).message);
      updateDraft(task.id, studentId, { status: 'error' });
    }
  }

  async function patchTask(task: ProfessorTask, action: 'close' | 'reopen' | 'delete') {
    if (action === 'delete' && !window.confirm(`حذف «${task.title}» نهائيًا مع كل التسليمات؟`)) return;
    setError('');
    setBusy(task.id);
    try {
      await api('/api/tasks/manage', {
        method: 'PATCH',
        body: JSON.stringify({ taskId: task.id, action }),
      });
      if (openId === task.id) setOpenId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  function deadlineLabel(deadline: string) {
    const date = new Date(deadline);
    return date.getTime() <= now ? 'انتهت المهلة' : `تُغلق ${formatDistance(date, now, { addSuffix: false, locale: ar })}`;
  }

  const openTasks = tasks.filter((task) => task.status === 'OPEN');
  const closedTasks = tasks.filter((task) => task.status !== 'OPEN');

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient">التاسكات</h1>
          <p className="mt-1 text-ink-500">متابعة تسليمات الطلاب وتقييمها، وإنشاء تاسك أسبوعي أو شهري</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          تاسك جديد
        </Button>
      </div>

      {error ? <FormMessage className="mb-6">{error}</FormMessage> : null}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-ink-400">
            لا توجد تاسكات بعد — ابدأ بإنشاء أول تاسك
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {[...openTasks, ...closedTasks].map((task) => {
          const isPast = new Date(task.deadline).getTime() <= now;
          const expanded = openId === task.id;
          const submissions = task.submissions || [];
          const graded = submissions.filter((s) => s.score !== null).length;
          return (
            <Card key={task.id} className={expanded ? 'border-gold-400/35 shadow-gold-soft' : ''}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink-900">{task.title}</h3>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          task.status === 'OPEN'
                            ? 'bg-gold-500/15 text-gold-700'
                            : 'bg-white/70 text-ink-500'
                        }`}
                      >
                        {task.status === 'OPEN' ? 'مفتوح' : 'مغلق'}
                      </span>
                      <span className="rounded-lg bg-white/70 px-2 py-0.5 text-[11px] font-bold text-ink-500">
                        {task.kind === 'MONTHLY' ? 'شهري' : 'أسبوعي'}
                      </span>
                      {task.requiresFile ? (
                        <span className="flex items-center gap-1 rounded-lg bg-white/70 px-2 py-0.5 text-[11px] text-ink-500">
                          <Paperclip className="h-3 w-3" />
                          يتطلب ملف
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      {task.course.code} · {task.course.name}
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1.5 text-xs ${
                        isPast && task.status === 'OPEN' ? 'text-ember-600' : 'text-ink-400'
                      }`}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {deadlineLabel(task.deadline)} · {formatDate(task.deadline)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openTask(task)}>
                      <Users className="h-4 w-4" />
                      التسليمات ({task._count?.submissions ?? submissions.length})
                      <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      disabled={busy === task.id}
                      onClick={() => patchTask(task, task.status === 'OPEN' ? 'close' : 'reopen')}
                    >
                      {busy === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {task.status === 'OPEN' ? 'إغلاق التاسك' : 'إعادة فتح'}
                    </Button>
                    <Button variant="danger" size="sm" disabled={busy === task.id} onClick={() => patchTask(task, 'delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {task.description ? <p className="mt-3 text-sm text-ink-500">{task.description}</p> : null}

                {expanded ? (
                  <div className="mt-4 border-t border-brand-900/10 pt-4">
                    <p className="mb-3 text-xs font-bold text-gold-700">
                      {graded} من {submissions.length} تم تقييمهم — الدرجة من 100
                    </p>
                    {submissions.length === 0 ? (
                      <p className="py-6 text-center text-sm text-ink-400">لا توجد تسليمات بعد</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-right">
                          <thead>
                            <tr className="border-b border-brand-900/10 text-xs text-ink-500">
                              <th className="px-2 py-2 font-semibold">الطالب</th>
                              <th className="px-2 py-2 font-semibold">وقت التسليم</th>
                              <th className="px-2 py-2 font-semibold">الملف</th>
                              <th className="px-2 py-2 font-semibold">الدرجة</th>
                              <th className="px-2 py-2 font-semibold">ملاحظات الدكتور</th>
                              <th className="px-2 py-2 font-semibold" />
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((sub) => {
                              const draft = getDraft(task.id, sub.studentId);
                              return (
                                <tr key={sub.id} className="border-b border-brand-900/[0.07]">
                                  <td className="px-2 py-2.5">
                                    <p className="font-semibold text-ink-900">{sub.student.name}</p>
                                    <p className="font-latin text-[11px] text-ink-400" dir="ltr">
                                      {sub.student.studentCode || '—'}
                                    </p>
                                  </td>
                                  <td className="px-2 py-2.5 text-xs text-ink-500">{formatDate(sub.submittedAt)}</td>
                                  <td className="px-2 py-2.5">
                                    {sub.fileUrl ? (
                                      <a
                                        href={sub.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-gold-800"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        الحل
                                      </a>
                                    ) : (
                                      <span className="text-xs text-ink-300">بدون ملف</span>
                                    )}
                                  </td>
                                  <td className="px-1.5 py-2.5">
                                    <Input
                                      inputMode="numeric"
                                      aria-label={`درجة ${sub.student.name}`}
                                      value={draft.score}
                                      onChange={(e) => updateDraft(task.id, sub.studentId, { score: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') void saveScore(task, sub.studentId);
                                      }}
                                      className="h-9 w-20 text-center"
                                    />
                                  </td>
                                  <td className="px-1.5 py-2.5">
                                    <Input
                                      aria-label={`ملاحظات لـ ${sub.student.name}`}
                                      value={draft.feedback}
                                      onChange={(e) =>
                                        updateDraft(task.id, sub.studentId, { feedback: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') void saveScore(task, sub.studentId);
                                      }}
                                      placeholder="تعليق اختياري…"
                                      className="h-9 w-52 text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    {draft.status === 'saving' ? (
                                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-gold-700" />
                                    ) : draft.status === 'saved' ? (
                                      <CheckCircle2 className="mx-auto h-4 w-4 text-gold-700" />
                                    ) : draft.status === 'error' ? (
                                      <XCircle className="mx-auto h-4 w-4 text-ember-600" />
                                    ) : null}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showModal ? (
        <NewTaskModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onCreated={async () => {
            setShowModal(false);
            await load();
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function NewTaskModal({
  courses,
  onClose,
  onCreated,
}: {
  courses: Course[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const deadline = String(form.get('deadline') || '');
    const date = deadline ? new Date(deadline) : null;
    if (!date || Number.isNaN(date.getTime())) {
      setError('اختر موعد نهائي صحيح');
      return;
    }
    if (date.getTime() <= Date.now()) {
      setError('الموعد النهائي لازم يكون تاريخ في المستقبل');
      return;
    }
    setSaving(true);
    try {
      await api('/api/tasks/manage', {
        method: 'POST',
        body: JSON.stringify({
          courseId: form.get('courseId'),
          title: form.get('title'),
          description: form.get('description') || undefined,
          kind: form.get('kind'),
          deadline: date.toISOString(),
          requiresFile: form.get('requiresFile') === 'on',
        }),
      });
      await onCreated();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#06110d]/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-gold-400/30 shadow-gold-soft">
        <CardHeader className="flex items-start justify-between">
          <CardTitle className="text-gold-gradient">تاسك جديد</CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-500 transition hover:bg-white/70 hover:text-ink-900"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <Form onSubmit={submit}>
            <FormField>
              <Label htmlFor="courseId">المقرر</Label>
              <select
                id="courseId"
                name="courseId"
                required
                className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm text-ink-900 outline-none transition focus:border-gold-400/60"
              >
                <option value="" className="text-black">
                  اختر المقرر
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id} className="text-black">
                    {course.code} — {course.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField>
              <Label htmlFor="title">عنوان التاسك</Label>
              <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="مثال: حل شيت التفاضل" />
            </FormField>
            <FormField>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-gold-400/60"
                placeholder="تفاصيل التاسك…"
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField>
                <Label htmlFor="kind">النوع</Label>
                <select
                  id="kind"
                  name="kind"
                  required
                  defaultValue="WEEKLY"
                  className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm text-ink-900 outline-none transition focus:border-gold-400/60"
                >
                  <option value="WEEKLY" className="text-black">
                    أسبوعي
                  </option>
                  <option value="MONTHLY" className="text-black">
                    شهري
                  </option>
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="deadline">الموعد النهائي</Label>
                <Input id="deadline" name="deadline" type="datetime-local" required className="[color-scheme:dark]" />
              </FormField>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-900/10 bg-white/60 px-4 py-3">
              <span className="text-sm font-semibold text-ink-700">إلزام الطالب برفع ملف</span>
              <input
                type="checkbox"
                name="requiresFile"
                className="h-5 w-5 accent-[#e8ae2e]"
              />
            </label>
            <FormMessage>{error}</FormMessage>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إنشاء التاسك
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
