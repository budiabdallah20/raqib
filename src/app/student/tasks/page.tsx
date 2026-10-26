'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, FileUp, FileText } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Submission = {
  fileUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  deadline: string;
  requiresFile: boolean;
  status: string;
  course: { name: string; code: string };
  submission: Submission | null;
};

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'zip'];
const MAX_BYTES = 5 * 1024 * 1024;

// رفع ملف الحل عبر /api/upload/task — FormData مباشر (الـ helper api نوعه JSON)
async function uploadTaskFile(
  file: File,
): Promise<{ url: string; uploadToken: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/task', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    uploadToken?: string;
    error?: string;
  };
  if (!res.ok || !data.url || !data.uploadToken) {
    throw new Error(data.error || 'تعذر رفع الملف');
  }
  return { url: data.url, uploadToken: data.uploadToken };
}

// حالات المهمة الظاهرة للطالب
function taskState(task: TaskItem) {
  const deadline = new Date(task.deadline).getTime();
  if (task.status !== 'OPEN') {
    return { label: 'مغلقة', className: 'border-ember-500/40 bg-ember-500/10 text-ember-600' };
  }
  if (task.submission) {
    if (new Date(task.submission.submittedAt).getTime() > deadline) {
      return { label: 'تسليم متأخر', className: 'border-ember-500/40 bg-ember-500/10 text-ember-600' };
    }
    return { label: 'تم التسليم', className: 'border-lime-500/40 bg-lime-500/10 text-brand-700' };
  }
  if (deadline <= Date.now()) {
    return { label: 'فاتت المدة', className: 'border-ember-500/40 bg-ember-500/10 text-ember-600' };
  }
  return { label: 'مفتوحة', className: 'border-gold-400/40 bg-gold-400/10 text-gold-800' };
}

// عدّاد تنازلي حتى موعد التسليم
function countdown(task: TaskItem): { text: string; urgent: boolean } | null {
  if (task.status !== 'OPEN') return null;
  const diff = new Date(task.deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const minutes = Math.ceil(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return { text: `باقي ${days} يوم و${hours % 24} ساعة`, urgent: false };
  }
  if (hours > 0) {
    return { text: `باقي ${hours} ساعة و${minutes % 60} دقيقة`, urgent: true };
  }
  return { text: `باقي ${minutes} دقيقة`, urgent: true };
}

function TaskRow({
  task,
  onSubmitted,
}: {
  task: TaskItem;
  onSubmitted: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [rowError, setRowError] = React.useState('');
  const state = taskState(task);
  const left = task.status === 'OPEN' && !task.submission ? countdown(task) : null;
  const expired = new Date(task.deadline).getTime() <= Date.now();

  const submit = async () => {
    setBusy(true);
    setRowError('');
    try {
      let fileUrl: string | undefined;
      let uploadToken: string | undefined;
      if (file) {
        const uploaded = await uploadTaskFile(file);
        fileUrl = uploaded.url;
        uploadToken = uploaded.uploadToken;
      } else if (task.requiresFile && !task.submission?.fileUrl) {
        throw new Error('اختر ملف الحل أولًا');
      }
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ taskId: task.id, fileUrl, uploadToken }),
      });
      setOpen(false);
      setFile(null);
      onSubmitted();
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-900/10 bg-white/605 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-950">{task.title}</p>
          {task.description ? (
            <p className="mt-1 text-xs leading-relaxed text-ink-400">
              {task.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className={`rounded-full border px-2.5 py-0.5 font-bold ${state.className}`}>
              {state.label}
            </span>
            <span className="text-ink-400">التسليم قبل {formatDate(task.deadline)}</span>
            {left ? (
              <span className={left.urgent ? 'font-bold text-ember-600' : 'text-gold-800'}>
                ⏳ {left.text}
              </span>
            ) : null}
            {task.requiresFile ? (
              <span className="text-ink-400">مطلوب رفع ملف</span>
            ) : null}
          </div>
        </div>
        {task.submission ? (
          <div className="text-left">
            <p className="text-xs text-ink-400">الدرجة</p>
            <p className="font-display text-2xl font-bold text-gold-700">
              {task.submission.score ?? '—'}
            </p>
          </div>
        ) : null}
      </div>

      {task.submission ? (
        <div className="mt-3 space-y-2 rounded-xl border border-brand-900/10 bg-white/605 p-3 text-xs">
          <p className="text-ink-500">
            سلّمت في {formatDate(task.submission.submittedAt)}
          </p>
          {task.submission.fileUrl ? (
            <a
              href={task.submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-gold-700 hover:text-gold-800"
            >
              <FileText className="h-3.5 w-3.5" />
              عرض الملف المرفق
            </a>
          ) : null}
          {task.submission.feedback ? (
            <p className="rounded-lg bg-gold-400/[0.08] px-3 py-2 text-gold-800">
              ملاحظات الدكتور: {task.submission.feedback}
            </p>
          ) : null}
        </div>
      ) : null}

      {rowError ? (
        <p role="alert" className="mt-3 text-xs text-ember-600">
          {rowError}
        </p>
      ) : null}

      {task.status === 'OPEN' && (open || task.submission) ? (
        <div className="mt-3 space-y-3 rounded-xl border border-gold-400/25 bg-gold-400/[0.05] p-3">
          {task.requiresFile ? (
            <div>
              <Label htmlFor={`file-${task.id}`} className="text-xs">
                ملف الحل (PDF / JPG / PNG / ZIP — بحد 5 ميجابايت)
              </Label>
              <Input
                id={`file-${task.id}`}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.zip"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setRowError('');
                  if (selected) {
                    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
                    if (!ALLOWED_EXTENSIONS.includes(ext)) {
                      setRowError('نوع الملف غير مدعوم (الصيغ المسموحة: PDF / JPG / PNG / ZIP)');
                      event.target.value = '';
                      return;
                    }
                    if (selected.size > MAX_BYTES) {
                      setRowError('حجم الملف يجب أن يكون 5 ميجابايت كحد أقصى');
                      event.target.value = '';
                      return;
                    }
                  }
                  setFile(selected);
                }}
              />
              {file ? (
                <p className="mt-1.5 text-xs text-ink-400">المختار: {file.name}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-ink-500">
              هذه المهمة لا تحتاج ملف — اضغط «تأكيد التسليم» فقط
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void submit()} disabled={busy}>
              {busy ? 'جارٍ التسليم...' : 'تأكيد التسليم'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      ) : null}

      {task.status === 'OPEN' && !open && !task.submission ? (
        <div className="mt-3">
          {expired ? (
            <p className="flex items-center gap-2 text-xs text-ember-600">
              <AlertTriangle className="h-4 w-4" />
              انتهت المدة — لم تتسلمها في الوقت
            </p>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <FileUp className="h-4 w-4" />
              تسليم الحل
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

// تجميع المهام حسب المقرر
function groupByCourse(tasks: TaskItem[]) {
  const groups = new Map<string, { course: TaskItem['course']; tasks: TaskItem[] }>();
  tasks.forEach((task) => {
    const key = task.course.code;
    const existing = groups.get(key);
    if (existing) existing.tasks.push(task);
    else groups.set(key, { course: task.course, tasks: [task] });
  });
  return Array.from(groups.values());
}

export default function StudentTasksPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  const load = React.useCallback(() => {
    return api<{ tasks: TaskItem[] }>('/api/tasks')
      .then((data) => setTasks(data.tasks || []))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // تحديث العدادات كل دقيقة — تغيير tick يعيد الرندر فتُحدَّث العدادات
  React.useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const weekly = React.useMemo(() => groupByCourse(tasks.filter((t) => t.kind === 'WEEKLY')), [tasks]);
  const monthly = React.useMemo(() => groupByCourse(tasks.filter((t) => t.kind === 'MONTHLY')), [tasks]);


  const renderGroups = (groups: ReturnType<typeof groupByCourse>) => {
    if (!groups.length) {
      return (
        <p className="py-10 text-center text-sm text-ink-400">
          لا توجد مهام في هذا القسم حاليًا
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.course.code}>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="text-gold-700">{group.course.code}</span> · {group.course.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.tasks.map((task) => (
                <TaskRow key={task.id} task={task} onSubmitted={() => void load()} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">المهام والتسليمات</h1>
          <p className="mt-1 text-ink-500">حلول أسبوعية وشهرية لمقرراتك</p>
        </div>
        <p className="flex items-center gap-2 text-xs text-brand-700">
          <CheckCircle2 className="h-4 w-4" />
          التسليم قبل الموعد يحفظ درجتك
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-ink-400">جارٍ تحميل المهام...</p>
      ) : (
        <Tabs defaultValue="weekly">
          <TabsList>
            <TabsTrigger value="weekly">أسبوعية</TabsTrigger>
            <TabsTrigger value="monthly">شهرية</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">{renderGroups(weekly)}</TabsContent>
          <TabsContent value="monthly">{renderGroups(monthly)}</TabsContent>
        </Tabs>
      )}
    </DashboardShell>
  );
}
