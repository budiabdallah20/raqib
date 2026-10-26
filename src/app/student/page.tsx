'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';
import {
  BookOpen,
  Cake,
  CalendarDays,
  ClipboardList,
  Percent,
  Phone,
  QrCode,
  User,
  type LucideIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { QRScanner } from '@/components/QRScanner';
import { AyahTicker } from '@/components/student/AyahTicker';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { SCHED_KIND_LABEL } from '@/lib/constants';

type DashboardData = {
  me: {
    name: string;
    studentCode: string | null;
    group: string | null;
    level: string | null;
    phone: string | null;
    avatarUrl: string | null;
    birthDate: string | null;
  };
  stats: {
    courses: number;
    attendancePct: number | null;
    lateTasks: number;
    midtermScores: number | null;
  };
  todayLectures: {
    period: number;
    title: string;
    time: string;
    kind: string;
    room: string | null;
    isVip: boolean;
    professor: string;
  }[];
  lastGrades: {
    course: { name: string; code: string };
    quiz: number | null;
    work: number | null;
    midterm: number | null;
    total: number;
  }[];
  unread: number;
};

const DAY_NAMES = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

// عدد الأيام حتى عيد الميلاد التالي (0 = النهاردة عيد ميلاده)
function birthdayCountdown(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  let diff = differenceInCalendarDays(next, today);
  if (diff < 0) {
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    diff = differenceInCalendarDays(next, today);
  }
  return diff;
}

// لون نقطة الدرجة: ≥75 أخضر، ≥50 ذهبي، أقل أحمر
function gradeDotClass(total: number) {
  if (total >= 75) return 'bg-lime-400';
  if (total >= 50) return 'bg-gold-400';
  return 'bg-ember-500';
}

function QuickLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
    >
      <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-400">{subtitle}</span>
      </span>
    </Link>
  );
}

function StudentDashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [scanOpen, setScanOpen] = React.useState(false);
  const handledQuery = React.useRef('');

  const load = React.useCallback(() => {
    return api<DashboardData>('/api/student/dashboard')
      .then((result) => setData(result))
      .catch((err) => setError((err as Error).message));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const submitToken = React.useCallback(
    async (value: string) => {
      setError('');
      setMessage('');
      try {
        const result = await api<{ lecture: { title: string; course: string } }>(
          '/api/attendance',
          { method: 'POST', body: JSON.stringify({ token: value }) },
        );
        setMessage(`تم تسجيل حضورك في ${result.lecture.course} — ${result.lecture.title}`);
        setScanOpen(false);
        await load();
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [load],
  );

  // حضور عبر رمز في الرابط (?token=...)
  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token && handledQuery.current !== token) {
      handledQuery.current = token;
      void submitToken(token);
    }
  }, [searchParams, submitToken]);

  const todayName = DAY_NAMES[new Date().getDay()] ?? '';
  const birthdayDays = data ? birthdayCountdown(data.me.birthDate) : null;

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">لوحة الطالب</h1>
          <p className="mt-1 text-ink-500">يومك الدراسي في مكان واحد</p>
        </div>
        <Button onClick={() => setScanOpen(true)}>
          <QrCode className="h-4 w-4" />
          تسجيل حضور
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-lime-500/25 bg-lime-500/[0.08] px-4 py-3 text-sm text-brand-700">
          {message}
        </p>
      ) : null}

      {!data && !error ? (
        <p className="py-16 text-center text-ink-400">جارٍ تحميل بياناتك...</p>
      ) : null}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* كارت الترحيب */}
            <Card className="border-gold-400/25 shadow-gold-soft">
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gold-400/25 bg-gold-400/15">
                    {data.me.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.me.avatarUrl}
                        alt={data.me.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-gold-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-2xl font-bold text-ink-950">
                      أهلًا، {data.me.name} 👋
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">
                      كود الطالب{' '}
                      <span className="font-bold text-gold-700">
                        {data.me.studentCode ?? '—'}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-gold-400/25 bg-gold-400/15 px-3 py-1 text-xs text-gold-800">
                        جروب {data.me.group ?? '—'}
                      </span>
                      <span className="rounded-full border border-gold-400/25 bg-gold-400/15 px-3 py-1 text-xs text-gold-800">
                        الفرقة {data.me.level ?? '—'}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full border border-brand-900/10 bg-white/65 px-3 py-1 text-xs text-ink-600">
                        <Phone className="h-3 w-3" />
                        {data.me.phone ?? '—'}
                      </span>
                    </div>
                  </div>
                  {birthdayDays !== null ? (
                    <div
                      className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${
                        birthdayDays === 0
                          ? 'border-gold-400/60 bg-gold-400/15 text-gold-800 shadow-gold-soft'
                          : 'border-gold-400/25 bg-gold-400/10 text-gold-800'
                      }`}
                    >
                      <Cake className="h-5 w-5 shrink-0 text-gold-700" />
                      <span className="text-sm font-bold">
                        {birthdayDays === 0
                          ? 'كل عام وأنت بخير 🎉'
                          : `عيد ميلادك بعد ${birthdayDays} يوم 🎂`}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-brand-900/10 pt-4">
                  <AyahTicker />
                </div>
              </CardContent>
            </Card>

            {/* الإحصائيات */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard title="المقررات" value={data.stats.courses} icon={BookOpen} />
              <StatsCard
                title="نسبة الحضور"
                value={data.stats.attendancePct === null ? '—' : `${data.stats.attendancePct}%`}
                icon={Percent}
              />
              <StatsCard
                title="مهام لم تُسلّم"
                value={data.stats.lateTasks}
                hint={data.stats.lateTasks > 0 ? 'فوات موعد تسليمها' : undefined}
                icon={ClipboardList}
              />
              <StatsCard
                title="متوسط الميدترم"
                value={data.stats.midtermScores === null ? '—' : data.stats.midtermScores}
                icon={Percent}
              />
            </div>

            {/* محاضرات النهاردة */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>محاضرات النهاردة · {todayName}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.todayLectures.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.todayLectures.map((lecture) => (
                      <div
                        key={`${lecture.period}-${lecture.title}`}
                        className={`flex items-start gap-3 rounded-2xl border p-4 ${
                          lecture.isVip
                            ? 'border-gold-400/45 bg-gold-400/10 shadow-gold-soft'
                            : 'border-brand-900/10 bg-white/605'
                        }`}
                      >
                        <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                          <CalendarDays className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-snug text-ink-950">
                            {lecture.isVip ? '⭐ ' : ''}
                            {lecture.title}
                          </p>
                          <p className="mt-1 text-xs text-ink-400">
                            {SCHED_KIND_LABEL[lecture.kind] ?? lecture.kind} ·{' '}
                            {lecture.room ?? 'قاعة غير محددة'}
                          </p>
                          <p className="mt-1 text-xs text-ink-500" dir="ltr">
                            {lecture.time}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-400">
                            د. {lecture.professor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-ink-400">
                    ☕ مفيش محاضرات النهاردة — استغل يومك
                  </p>
                )}
              </CardContent>
            </Card>

            {/* آخر الدرجات */}
            <Card>
              <CardHeader>
                <CardTitle>آخر الدرجات</CardTitle>
              </CardHeader>
              <CardContent>
                {data.lastGrades.length ? (
                  <ul className="space-y-3">
                    {data.lastGrades.map((grade) => (
                      <li
                        key={grade.course.code}
                        className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4"
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${gradeDotClass(grade.total)}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink-900">
                            {grade.course.name}
                          </p>
                          <p className="text-xs text-ink-400">
                            {grade.course.code} · كويز {grade.quiz ?? '—'} · أعمال{' '}
                            {grade.work ?? '—'} · ميدترم {grade.midterm ?? '—'}
                          </p>
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            grade.total >= 75
                              ? 'text-brand-700'
                              : grade.total >= 50
                                ? 'text-gold-700'
                                : 'text-ember-600'
                          }`}
                        >
                          {grade.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-ink-400">
                    لا توجد درجات مسجلة بعد
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* العمود الجانبي */}
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>روابط سريعة</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <QuickLink
                  href="/student/tasks"
                  icon={ClipboardList}
                  title="المهام والتسليمات"
                  subtitle="حلول أسبوعية وشهرية"
                />
                <QuickLink
                  href="/student/schedule"
                  icon={CalendarDays}
                  title="الجدول الأسبوعي"
                  subtitle="حصص جروبك كاملة"
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}

      {scanOpen ? (
        <QRScanner
          onResult={(value) => {
            void submitToken(value);
          }}
          onClose={() => setScanOpen(false)}
        />
      ) : null}
    </DashboardShell>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-ink-400">جارٍ التحميل...</div>}>
      <StudentDashboard />
    </Suspense>
  );
}
