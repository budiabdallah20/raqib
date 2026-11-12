'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  CalendarDays,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { RadialProgress } from '@/components/student/RadialProgress';
import { EmptyState } from '@/components/student/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { DAY_AR } from '@/lib/enrollment';
import { cn } from '@/lib/utils';

type SlotView = { day: number; period: number; group: string };

type AvailableCourse = {
  id: string;
  code: string;
  name: string;
  englishName: string | null;
  creditHours: number;
  professor: { name: string };
  _count: { enrollments: number };
  slots: SlotView[];
  conflicts: { day: number; period: number; myCourseId: string; candidateCourseId: string; label: string }[];
  canEnroll: boolean;
  blockers: string[];
};

type EnrolledCourse = {
  id: string;
  createdAt: string;
  code: string;
  name: string;
  englishName: string | null;
  creditHours: number;
  professor: { name: string };
  _count: { enrollments: number };
  totalEnrolled: number;
};

type RegistrationData = {
  group: string;
  activeTerm: string;
  maxCredits: number;
  credits: { enrolled: number; max: number; remaining: number };
  enrolled: EnrolledCourse[];
  available: AvailableCourse[];
};

function SlotChips({ slots, myGroup }: { slots: SlotView[]; myGroup: string }) {
  if (slots.length === 0) {
    return <span className="text-[10px] text-ink-400">بدون خانات جدول منشورة بعد</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {slots.map((slot, index) => {
        const foreign = slot.group !== myGroup;
        return (
          <span
            key={`${slot.day}-${slot.period}-${index}`}
            title={foreign ? `شعبة الجروب ${slot.group} — ستحضر هذه الشعبة` : undefined}
            className={cn(
              'rounded-md border px-1.5 py-0.5 text-[9px] font-bold',
              foreign
                ? 'border-violet-500/30 bg-violet-500/[0.08] text-violet-800'
                : 'border-brand-900/10 bg-white/70 text-ink-500',
            )}
          >
            {DAY_AR[slot.day] ?? slot.day} · حصة {slot.period}
            {foreign ? ` · جروب ${slot.group}` : ''}
          </span>
        );
      })}
    </span>
  );
}

export default function StudentRegistrationPage() {
  const [data, setData] = React.useState<RegistrationData | null>(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const result = await api<RegistrationData>('/api/student/registration');
      setData(result);
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

  async function act(courseId: string, action: 'enroll' | 'drop') {
    if (action === 'drop') {
      const course = data?.enrolled.find((item) => item.id === courseId);
      const label = course ? `${course.code} — ${course.name}` : 'المقرر';
      if (!window.confirm(`سحب «${label}» من جدولك؟ السجل يُحفظ (مش حذف نهائي) ويمكن التسجيل تاني لو فتحت الفرصة.`)) return;
    }
    setBusyId(courseId);
    setError('');
    setNotice('');
    try {
      await api('/api/student/registration', {
        method: 'POST',
        body: JSON.stringify({ courseId, action }),
      });
      setNotice(action === 'enroll' ? 'تم التسجيل — مبروك!' : 'تم السحب — السجل محفوظ.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const credits = data?.credits;

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-gold-700">
            <CalendarDays className="h-4 w-4" /> تسجيل ذاتي · الترم {data?.activeTerm ?? '…'} · الجروب {data?.group ?? '…'}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">التسجيل والساعات</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            سجّل اللي يعجبك وأنت مرتاح — المحرك يرفض بهدوء أي تجاوز للحد أو تعارض مواعيد،
            وسيسجّل كل حاجة في سجل التدقيق تلقائيًا.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      ) : null}
      {notice ? (
        <Card className="mb-6 border-emerald-500/30 bg-emerald-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
          </CardContent>
        </Card>
      ) : null}

      {/* ═══ الساعات المعتمدة ═══ */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-6 p-5">
          <RadialProgress
            value={credits?.enrolled ?? null}
            max={credits?.max ?? 17}
            size={120}
            stroke={10}
            tone="gold"
            valueText={credits ? `${credits.enrolled}` : '…'}
            labelText={`من ${credits?.max ?? 17}`}
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-ink-950">رصيد الساعات المعتمدة</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              متبقي لك <b className="text-ink-800">{credits?.remaining ?? '…'}</b> ساعة من الحد الأقصى
              (<b className="text-ink-800">{credits?.max ?? 17}</b>) — الحد تضبطه إدارة الكلية من
              «الإعدادات» ← «حد الساعات المعتمدة». كل تسجيل أو سحب يتحسب لحظيًا من قاعدة البيانات
              داخل معاملة آمنة، ومُسجّل في سجل التدقيق.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-ink-400">
              <span className="rounded-lg border border-brand-900/10 bg-white/70 px-2 py-1">✓ بلا تجاوز للحد</span>
              <span className="rounded-lg border border-brand-900/10 bg-white/70 px-2 py-1">✓ بلا تعارض مواعيد</span>
              <span className="rounded-lg border border-brand-900/10 bg-white/70 px-2 py-1">✓ بلا تكرار</span>
              <span className="rounded-lg border border-brand-900/10 bg-white/70 px-2 py-1">✓ سجل دائم لكل عملية</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!data && loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
          ))}
        </div>
      ) : data ? (
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">المتاحة للتسجيل ({data.available.length})</TabsTrigger>
            <TabsTrigger value="mine">مقرراتي ({data.enrolled.length})</TabsTrigger>
          </TabsList>

          {/* ═══ المتاحة ═══ */}
          <TabsContent value="available" className="mt-4 grid gap-4 md:grid-cols-2">
            {data.available.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState
                  kind="dayOff"
                  title="ما فيش مقررات متاحة زيادة"
                  sub="أنت مسجّل في كل المقررات المطروحة — أو الكلية لم تنشر مقررات للترم ده بعد."
                />
              </div>
            ) : null}
            {data.available.map((course) => {
              const busy = busyId === course.id;
              return (
                <Card key={course.id} className={cn('overflow-hidden transition', !course.canEnroll && 'opacity-90')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-[10px] font-bold text-gold-700">
                          {course.code} · {course.creditHours} ساعات معتمدة
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink-950" title={course.name}>
                          {course.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-400">
                          <span className="truncate">د. {course.professor.name}</span>
                          <span className="flex shrink-0 items-center gap-1"><Users className="h-3 w-3" />{course._count.enrollments}</span>
                        </p>
                      </div>
                      {course.canEnroll ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-700">
                          متاح
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-extrabold text-rose-700">
                          <ShieldAlert className="h-3 w-3" /> مغلق
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-[10px] text-ink-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
                      <SlotChips slots={course.slots} myGroup={data?.group ?? 'A'} />
                    </div>

                    {course.blockers.length > 0 ? (
                      <ul className="mt-2 grid gap-1 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2 text-[10px] font-semibold text-rose-800">
                        {course.blockers.map((blocker, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                            {blocker}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <Button
                      className="mt-3 w-full"
                      disabled={!course.canEnroll || busy}
                      onClick={() => void act(course.id, 'enroll')}
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      سجّلني في هذا المقرر
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ═══ مقرراتي ═══ */}
          <TabsContent value="mine" className="mt-4 grid gap-4 md:grid-cols-2">
            {data.enrolled.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState
                  kind="lectures"
                  title="لسه مسجّلتِش في أي مقرر"
                  sub="التسجيل الذاتي من تبويب «المتاحة للتسجيل» — كل تسجيل يتأثر لحظيًا على جدولك وبوصلتك."
                />
              </div>
            ) : null}
            {data.enrolled.map((course) => {
              const busy = busyId === course.id;
              return (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-[10px] font-bold text-gold-700">
                          {course.code} · {course.creditHours} ساعات معتمدة
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink-950" title={course.name}>
                          {course.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-400">
                          <span className="truncate">د. {course.professor.name}</span>
                          <span className="flex shrink-0 items-center gap-1"><Users className="h-3 w-3" />{course.totalEnrolled} مسجل</span>
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[9px] text-ink-400">
                          <Clock3 className="h-3 w-3" />
                          سُجّلت في {new Date(course.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => void act(course.id, 'drop')}
                        aria-label="سحب المقرر"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        سحب
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      ) : null}
    </StudentShell>
  );
}
