'use client';

/**
 * 🛰 سجل المحاضرات — محاضرات مقرراتك مرتبة زمنيًا + حالة حضورك فيكل واحدة،
 * مع توهج خاص للمحاضرة المفتوحة الآن (امسح قبل الإغلاق).
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Clock3, MapPin, RadioTower } from 'lucide-react';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/student/EmptyState';
import { RowsSkeleton } from '@/components/student/Skeletons';
import { cn } from '@/lib/utils';

type LectureRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  isOpen: boolean;
  course: { name: string; code: string };
  attendances: { status: string; scannedAt: string }[];
};

export default function StudentLecturesPage() {
  const [lectures, setLectures] = React.useState<LectureRow[] | null>(null);
  const [error, setError] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'OPEN' | 'ATTENDED' | 'MISSED'>('ALL');

  React.useEffect(() => {
    api<{ lectures: LectureRow[] }>('/api/lectures')
      .then((data) => setLectures(data.lectures ?? []))
      .catch((err) => {
        setError((err as Error).message);
        setLectures([]);
      });
  }, []);

  const courseKeys = Array.from(new Map((lectures ?? []).map((lecture) => [lecture.course.code, lecture.course])).values());

  const shown = (lectures ?? []).filter((lecture) => {
    if (courseFilter !== 'ALL' && lecture.course.code !== courseFilter) return false;
    if (statusFilter === 'OPEN') return lecture.isOpen;
    if (statusFilter === 'ATTENDED') return lecture.attendances.length > 0;
    if (statusFilter === 'MISSED') return lecture.attendances.length === 0;
    return true;
  });

  const attendedCount = (lectures ?? []).filter((lecture) => lecture.attendances.length > 0).length;

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">سجل المحاضرات</h1>
          <p className="mt-1 text-ink-500">كل محاضرة مقرراتك وحالة حضورك فيها — آخر {lectures?.length ?? 0} محاضرة</p>
        </div>
        <Link href="/student">
          <Button variant="outline">
            <CheckCircle2 className="h-4 w-4" />
            امسح كود حضور
          </Button>
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600">
          {error}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([
          ['ALL', 'الكل'],
          ['OPEN', 'مفتوحة الآن'],
          ['ATTENDED', 'حضرتها'],
          ['MISSED', 'لم أحضرها'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
              statusFilter === value
                ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
                : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-brand-900/10" />
        <button
          type="button"
          onClick={() => setCourseFilter('ALL')}
          className={cn(
            'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
            courseFilter === 'ALL'
              ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
              : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
          )}
        >
          كل المواد
        </button>
        {courseKeys.map((course) => (
          <button
            key={course.code}
            type="button"
            onClick={() => setCourseFilter(course.code)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
              courseFilter === course.code
                ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
                : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
            )}
          >
            {course.code}
          </button>
        ))}
      </div>

      {lectures === null ? (
        <RowsSkeleton rows={5} />
      ) : !lectures.length ? (
        <EmptyState
          kind="lectures"
          title="لسه مفيش محاضرات متسجلة"
          sub="بعد أول محاضرة للمواد المسجل فيها هتظهر هنا"
        />
      ) : shown.length === 0 ? (
        <EmptyState kind="lectures" compact title="مفيش محاضرة مطابقة للفلتر" />
      ) : (
        <div className="space-y-3">
          {attendedCount ? (
            <p className="text-[11px] text-ink-400">
              حضرت <span className="font-bold text-brand-700" dir="ltr">{attendedCount}</span> من{' '}
              <span dir="ltr">{lectures.length}</span> محاضرة في القايمة
            </p>
          ) : null}
          {shown.map((lecture, index) => {
            const status = lecture.attendances[0]?.status;
            const openNow = lecture.isOpen;
            return (
              <motion.div
                key={lecture.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.35) }}
              >
                <Card
                  className={cn(
                    openNow && 'border-brand-500/45 emerald-ring animate-pulse-ring',
                    !openNow && 'card-glow',
                  )}
                >
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <div className="flex min-w-[230px] items-center gap-3">
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                          openNow
                            ? 'border-brand-500/40 bg-brand-500/[0.12] text-brand-700'
                            : 'border-gold-400/25 bg-gold-400/10 text-gold-700',
                        )}
                      >
                        {openNow ? <RadioTower className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-950">{lecture.title}</p>
                        <p className="text-[10.5px] text-ink-400">
                          {lecture.course.code} · {lecture.course.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500">
                      <span className="flex items-center gap-1.5" dir="ltr">
                        <Clock3 className="h-3.5 w-3.5 text-ink-300" />
                        {new Date(lecture.startsAt).toLocaleString('ar-EG', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {lecture.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ink-300" />
                          {lecture.location}
                        </span>
                      ) : null}
                    </div>
                    <div className="ms-auto flex items-center gap-2">
                      {openNow ? (
                        <span className="flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/[0.12] px-2.5 py-1 text-[10.5px] font-bold text-brand-700">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                          مفتوحة الآن
                        </span>
                      ) : null}
                      <AttendChip status={status} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <CardHeader className="mt-8 flex items-center justify-center">
        <CardTitle className="text-[10px] font-bold text-ink-300">RAQiB Live Lectures</CardTitle>
      </CardHeader>
    </StudentShell>
  );
}

function AttendChip({ status }: { status: string | undefined }) {
  if (status === 'PRESENT') {
    return (
      <span className="rounded-full border border-brand-500/35 bg-brand-500/[0.10] px-2.5 py-1 text-[10.5px] font-bold text-brand-700">
        حضرتها ✅
      </span>
    );
  }
  if (status === 'LATE') {
    return (
      <span className="rounded-full border border-gold-400/40 bg-gold-400/[0.10] px-2.5 py-1 text-[10.5px] font-bold text-gold-800">
        حاضرة متأخرة ⏰
      </span>
    );
  }
  return (
    <span className="rounded-full border border-brand-900/10 bg-white/65 px-2.5 py-1 text-[10.5px] font-bold text-ink-400">
      لم تحضر
    </span>
  );
}
