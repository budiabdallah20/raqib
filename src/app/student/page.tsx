'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';
import {
  Award,
  BookOpen,
  Cake,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileDown,
  Percent,
  Phone,
  QrCode,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { QRScanner } from '@/components/QRScanner';
import { AyahTicker } from '@/components/student/AyahTicker';
import { StatsCard } from '@/components/StatsCard';
import { RadialProgress } from '@/components/student/RadialProgress';
import { GpaEntryModal } from '@/components/student/GpaEntryModal';
import { ZoneBadge, zoneHint } from '@/components/student/ZoneBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { GRADE_MAX } from '@/lib/grades';
import { zoneFor } from '@/lib/grades';
import { SCHED_KIND_LABEL } from '@/lib/constants';
import { celebrate } from '@/lib/celebrate';

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
  activeTerm: string;
  stats: {
    courses: number;
    attendancePct: number | null;
    lateTasks: number;
    midtermScores: number | null;
  };
  attendance: {
    total: number;
    past: number;
    cancelled: number;
    present: number;
    late: number;
    absent: number;
    weightedPct: number | null;
  };
  todayLectures: {
    period: number;
    title: string;
    code: string;
    time: string;
    kind: string;
    room: string | null;
    isVip: boolean;
    teacher: string;
  }[];
  upcoming: {
    day: number;
    period: number;
    title: string;
    code: string;
    kind: string;
    room: string | null;
    isVip: boolean;
    teacher: string;
    time: string;
    nextAt: string;
    daysUntil: number;
  } | null;
  lastGrades: {
    course: { name: string; code: string };
    quiz: number | null;
    work: number | null;
    midterm: number | null;
    final: number | null;
    total: number;
  }[];
  unread: number;
};

type ProfileData = {
  profile: {
    name: string;
    avatarUrl: string | null;
    level: string | null;
    department: string | null;
    studentCode: string | null;
    group: string | null;
    email: string | null;
    phone: string | null;
  };
  gpa: {
    previous: number | null;
    previousSetAt: string | null;
    term: number | null;
    cumulative: number | null;
    gradedCredits: number;
    creditTotal: number;
    maxTotal: number;
  };
  levelRank: { rank: number; of: number } | null;
  courses: {
    code: string;
    name: string;
    creditHours: number;
    components: { quiz: number | null; work: number | null; midterm: number | null; final: number | null } | null;
    total: number | null;
    letter: string | null;
    gpaPoint: number | null;
    graded: boolean;
    complete: boolean;
    rank: number | null;
    rankOf: number;
  }[];
  curve: { term: string; gpa: number | null }[];
};

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

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

// عدّاد تنازلي حي — يُحدّث كل ثانية
function useCountdown(target: string | null): string {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!target) return '';
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff)) return '';
  if (diff <= 0) return 'بدأت الآن!';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return days > 0 ? `${days} يوم و${clock}` : clock;
}

// شريط توزيع الدرجات المكدّس — كويز/أعمال/ميدترم/فاينل من 100
function DistributionBar({
  quiz,
  work,
  midterm,
  final: finalGrade,
}: {
  quiz: number | null;
  work: number | null;
  midterm: number | null;
  final: number | null;
}) {
  const segments = [
    { label: 'كويز', value: quiz ?? 0, max: GRADE_MAX.QUIZ, cls: 'bg-brand-500' },
    { label: 'أعمال', value: work ?? 0, max: GRADE_MAX.WORK, cls: 'bg-gold-400' },
    { label: 'ميدترم', value: midterm ?? 0, max: GRADE_MAX.MIDTERM, cls: 'bg-amber-500' },
    { label: 'فاينل', value: finalGrade ?? 0, max: GRADE_MAX.FINAL, cls: 'bg-orange-500', pending: finalGrade === null },
  ];
  const filled = segments.filter((segment) => segment.value > 0);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-brand-900/10">
        {filled.map((segment) => (
          <div
            key={segment.label}
            className={segment.cls}
            style={{ width: `${Math.max(1.5, (segment.value / 100) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-ink-400">
        {segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${segment.value > 0 ? segment.cls : 'bg-brand-900/15'}`} />
            {segment.label} {segment.pending ? '—' : `${segment.value}/${segment.max}`}
          </span>
        ))}
      </div>
    </div>
  );
}

// منحنى تطور المعدل — نقاط الترمات + الحالي
function CurveChart({ points }: { points: ProfileData['curve'] }) {
  const valid = points.filter((point) => point.gpa !== null);
  if (valid.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-ink-400">
        المنحنى هيظهر أول ما يكتمل معدل ترمين على الأقل
      </p>
    );
  }
  const w = 100;
  const h = 100;
  const pad = 10;
  const xs = valid.map((_, index) => pad + (index * (w - 2 * pad)) / (valid.length - 1));
  const ys = valid.map((point) => h - pad - ((point.gpa ?? 0) / 4) * (h - 2 * pad));
  const line = xs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x},${ys[index]}`).join(' ');
  const rising = ys[valid.length - 1]! <= ys[0]!;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-40 w-full">
        {/* خطوط المقياس 2.0 و 3.0 */}
        <line x1={pad} y1={h - pad - (2 / 4) * (h - 2 * pad)} x2={w - pad} y2={h - pad - (2 / 4) * (h - 2 * pad)} className="stroke-brand-900/[0.07]" strokeWidth={0.5} strokeDasharray="2 2" />
        <line x1={pad} y1={h - pad - (3 / 4) * (h - 2 * pad)} x2={w - pad} y2={h - pad - (3 / 4) * (h - 2 * pad)} className="stroke-brand-900/[0.07]" strokeWidth={0.5} strokeDasharray="2 2" />
        <path d={line} fill="none" className={rising ? 'stroke-lime-500' : 'stroke-ember-500'} strokeWidth={1.6} strokeLinecap="round" />
        {valid.map((point, index) => (
          <circle key={point.term} cx={xs[index]} cy={ys[index]} r={1.6} className={index === valid.length - 1 ? 'fill-gold-500' : rising ? 'fill-lime-500' : 'fill-ember-500'} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-400">
        {valid.map((point, index) => (
          <span key={point.term} className={index === valid.length - 1 ? 'font-bold text-gold-700' : ''}>
            {point.term}
          </span>
        ))}
      </div>
    </div>
  );
}

function StudentDashboard() {
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [scanOpen, setScanOpen] = React.useState(false);
  const [gpaOpen, setGpaOpen] = React.useState(false);
  const [gpaPrompted, setGpaPrompted] = React.useState(false);
  const handledQuery = React.useRef('');

  const load = React.useCallback(() => {
    return Promise.all([
      api<DashboardData>('/api/student/dashboard'),
      api<ProfileData>('/api/student/profile'),
    ])
      .then(([dashboard, profileData]) => {
        setData(dashboard);
        setProfile(profileData);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // نافذة المعدل السابق تُعرض تلقائياً مرة واحدة لو لسه مُدخلهاش
  React.useEffect(() => {
    if (profile && profile.gpa.previousSetAt === null && !gpaPrompted) {
      setGpaPrompted(true);
      setGpaOpen(true);
    }
  }, [profile, gpaPrompted]);

  const submitToken = React.useCallback(
    async (value: string) => {
      setError('');
      setMessage('');
      try {
        const result = await api<{ lecture: { title: string; course: string } }>('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({ token: value }),
        });
        celebrate();
        setMessage(`تم تسجيل حضورك في ${result.lecture.course} — ${result.lecture.title}`);
        setScanOpen(false);
        await load();
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [load],
  );

  // هويات ثابتة لـQRScanner حتى لا يعيد تشغيل الكاميرا مع كل ري-رندر
  const handleScanResult = React.useCallback((value: string) => {
    void submitToken(value);
  }, [submitToken]);
  const handleScanClose = React.useCallback(() => setScanOpen(false), []);

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
  const upcomingCountdown = useCountdown(data?.upcoming?.nextAt ?? null);
  const threshold = 75; // نسبة الحرمان — من سياسة الحضور (attendanceThreshold)

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">لوحة الطالب</h1>
          <p className="mt-1 text-ink-500">يومك الدراسي في مكان واحد</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/report">
            <Button variant="outline">
              <FileDown className="h-4 w-4" />
              التقرير الشامل
            </Button>
          </Link>
          <Button onClick={() => setScanOpen(true)}>
            <QrCode className="h-4 w-4" />
            تسجيل حضور
          </Button>
        </div>
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

      {!data || !profile ? (
        !error ? (
          <p className="py-16 text-center text-ink-400">جارٍ تحميل بياناتك...</p>
        ) : null
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* كارت البروفايل الفخم */}
            <Card className="border-gold-400/25 shadow-gold-soft">
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-gold-400/30 bg-gold-400/15 shadow-gold-soft">
                    {data.me.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={data.me.avatarUrl} alt={data.me.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-9 w-9 text-gold-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-2xl font-bold text-ink-950">
                      أهلًا، {data.me.name} 👋
                    </h2>
                    <p className="mt-1 text-sm text-ink-500">
                      كود الطالب{' '}
                      <span className="font-bold text-gold-700">{data.me.studentCode ?? '—'}</span>
                      {profile.profile.studentCode && data.me.studentCode !== profile.profile.studentCode
                        ? ` · رقم الجلوس ${profile.profile.studentCode}`
                        : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-gold-400/25 bg-gold-400/15 px-3 py-1 text-xs text-gold-800">
                        جروب {data.me.group ?? '—'}
                      </span>
                      <span className="rounded-full border border-gold-400/25 bg-gold-400/15 px-3 py-1 text-xs text-gold-800">
                        الفرقة {data.me.level ?? '—'}
                      </span>
                      <span className="rounded-full border border-brand-900/10 bg-white/65 px-3 py-1 text-xs text-ink-600">
                        {profile.profile.department ?? 'قسم غير محدد'}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full border border-brand-900/10 bg-white/65 px-3 py-1 text-xs text-ink-600">
                        <Phone className="h-3 w-3" />
                        {data.me.phone ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* مؤشرا المعدل */}
                  <div className="flex items-center gap-4">
                    <RadialProgress
                      value={profile.gpa.term}
                      valueText={profile.gpa.term === null ? '—' : profile.gpa.term.toFixed(2)}
                      labelText="ترم الحالي"
                      tone="gold"
                    />
                    <RadialProgress
                      value={profile.gpa.cumulative}
                      valueText={profile.gpa.cumulative === null ? '—' : profile.gpa.cumulative.toFixed(2)}
                      labelText="تراكمي"
                      tone="lime"
                    />
                    {profile.gpa.previousSetAt === null ? (
                      <button
                        type="button"
                        onClick={() => setGpaOpen(true)}
                        className="rounded-2xl border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-xs font-bold text-gold-800 transition hover:bg-gold-400/20"
                      >
                        أدخل معدلك السابق
                      </button>
                    ) : null}
                  </div>
                </div>

                {birthdayDays !== null ? (
                  <div
                    className={`inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 ${
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

                <div className="border-t border-brand-900/10 pt-4">
                  <AyahTicker />
                </div>
              </CardContent>
            </Card>

            {/* أزرار الوصول السريع */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link href="/student/schedule" className="group">
                <div className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]">
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">جدول اليوم</span>
                    <span className="block text-xs text-ink-400">
                      {data.todayLectures.length ? `${data.todayLectures.length} حصص — ${todayName}` : 'مفيش حصص النهاردة'}
                    </span>
                  </span>
                </div>
              </Link>
              <Link href="/student/tasks" className="group">
                <div className="relative flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]">
                  {data.stats.lateTasks > 0 ? (
                    <span className="absolute -top-1.5 left-3 rounded-full bg-ember-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {data.stats.lateTasks} متأخرة
                    </span>
                  ) : null}
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">التكليفات المعلقة</span>
                    <span className="block text-xs text-ink-400">
                      {data.stats.lateTasks > 0 ? 'عليك تسليمات فات موعدها' : 'مفيش تكليفات متأخرة'}
                    </span>
                  </span>
                </div>
              </Link>
              <button type="button" onClick={() => setScanOpen(true)} className="text-right">
                <div className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]">
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">كود حضور المحاضرة</span>
                    <span className="block text-xs text-ink-400">سكان كود المحاضرة أو إدخال الرمز</span>
                  </span>
                </div>
              </button>
              <Link href="/student/report" className="group">
                <div className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]">
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <FileDown className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">التقرير الشامل</span>
                    <span className="block text-xs text-ink-400">PDF أكاديمي + Excel طبقات</span>
                  </span>
                </div>
              </Link>
            </div>

            {/* المحاضرة القادمة — بعدّاد تنازلي حي */}
            {data.upcoming ? (
              <Card className={`overflow-hidden ${data.upcoming.isVip ? 'border-gold-400/45 shadow-gold-soft' : ''}`}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>المحاضرة القادمة</CardTitle>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-[11px] font-bold text-gold-800">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {DAY_NAMES[data.upcoming.day - 1] ?? ''} · {data.upcoming.time}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-xl font-bold text-ink-950">
                        {data.upcoming.isVip ? '⭐ ' : ''}
                        {data.upcoming.title}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {data.upcoming.code} · {SCHED_KIND_LABEL[data.upcoming.kind] ?? data.upcoming.kind} ·{' '}
                        {data.upcoming.room ?? 'قاعة غير محددة'} · {data.upcoming.teacher}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-center">
                      <p className="text-[10px] font-bold text-gold-700">تبدأ بعد</p>
                      <p className="font-display text-xl font-bold text-ink-950" dir="ltr">
                        {upcomingCountdown}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* مصفوفة تحليلات المواد */}
            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-ink-950">تحليلات المواد</h2>
                {profile.levelRank ? (
                  <p className="text-xs text-ink-500">
                    الترتيب التراكمي العام:{' '}
                    <span className="font-bold text-gold-700">
                      المركز {profile.levelRank.rank} من {profile.levelRank.of}
                    </span>{' '}
                    على مستوى الفرقة {data.me.level ?? ''}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {profile.courses.map((course) => {
                  const zone = course.total === null ? null : zoneFor(course.total);
                  return (
                    <Card key={course.code} className="border-glow">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-ink-950">{course.name}</p>
                            <p className="mt-0.5 text-[11px] text-ink-400">
                              {course.code} · {course.creditHours} ساعات
                            </p>
                          </div>
                          {course.letter ? (
                            <span className="shrink-0 rounded-xl border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 font-display text-sm font-bold text-gold-800">
                              {course.letter}
                            </span>
                          ) : course.graded && !course.complete ? (
                            <span className="shrink-0 rounded-xl border border-brand-900/10 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-ink-400">
                              قيد التقييم
                            </span>
                          ) : null}
                        </div>

                        <DistributionBar
                          quiz={course.components?.quiz ?? null}
                          work={course.components?.work ?? null}
                          midterm={course.components?.midterm ?? null}
                          final={course.components?.final ?? null}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-2xl font-bold text-ink-950">
                              {course.total === null ? '—' : course.total}
                            </span>
                            <span className="text-[11px] text-ink-400">/ {profile.gpa.maxTotal}</span>
                          </div>
                          {zone ? <ZoneBadge zone={zone} /> : (
                            <span className="rounded-full border border-brand-900/10 bg-white/65 px-2.5 py-1 text-[11px] text-ink-400">
                              لم تُسجل درجات
                            </span>
                          )}
                        </div>

                        {zone && course.total !== null ? (
                          <p
                            className={`rounded-xl px-3 py-2 text-[11px] font-bold ${
                              zone === 'RED'
                                ? 'bg-ember-500/[0.08] text-ember-600'
                                : zone === 'YELLOW'
                                  ? 'bg-gold-400/[0.10] text-gold-800'
                                  : 'bg-lime-500/[0.08] text-lime-700'
                            }`}
                          >
                            {zoneHint(zone, (course.total ?? 0) > 0)}
                          </p>
                        ) : null}

                        {course.rank !== null ? (
                          <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
                            <Award className="h-3.5 w-3.5 text-gold-700" />
                            المركز <span className="font-bold text-gold-700">{course.rank}</span> من {course.rankOf} في المادة
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* منحنى تطور المعدل */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>منحنى تطور معدلك</CardTitle>
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                  <TrendingUp className="h-4 w-4 text-lime-600" />
                  مقارنة بالترمات السابقة
                </span>
              </CardHeader>
              <CardContent>
                <CurveChart points={profile.curve} />
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
                        key={`${lecture.period}-${lecture.code}`}
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
                            {lecture.code} · {SCHED_KIND_LABEL[lecture.kind] ?? lecture.kind} ·{' '}
                            {lecture.room ?? 'قاعة غير محددة'}
                          </p>
                          <p className="mt-1 text-xs text-ink-500" dir="ltr">
                            {lecture.time}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-400">{lecture.teacher}</p>
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
                          <p className="text-sm font-bold text-ink-900">{grade.course.name}</p>
                          <p className="text-xs text-ink-400">
                            {grade.course.code} · كويز {grade.quiz ?? '—'} · أعمال {grade.work ?? '—'} ·
                            ميدترم {grade.midterm ?? '—'} · فاينل {grade.final ?? '—'}
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
                  <p className="py-6 text-center text-sm text-ink-400">لا توجد درجات مسجلة بعد</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* العمود الجانبي */}
          <aside className="space-y-6">
            {/* لوحة الحضور والغياب */}
            <Card>
              <CardHeader>
                <CardTitle>الحضور والغياب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <RadialProgress
                    value={data.attendance.weightedPct === null ? null : data.attendance.weightedPct}
                    max={100}
                    valueText={data.attendance.weightedPct === null ? '—' : `${data.attendance.weightedPct}%`}
                    labelText="حضور موزون"
                    tone={
                      data.attendance.weightedPct !== null && data.attendance.weightedPct >= threshold
                        ? 'lime'
                        : data.attendance.weightedPct !== null && data.attendance.weightedPct >= 60
                          ? 'gold'
                          : 'ember'
                    }
                    size={116}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl border border-brand-900/10 bg-white/65 px-3 py-2">
                    <p className="font-display text-lg font-bold text-lime-700">{data.attendance.present}</p>
                    <p className="text-[10px] text-ink-400">حاضر</p>
                  </div>
                  <div className="rounded-xl border border-brand-900/10 bg-white/65 px-3 py-2">
                    <p className="font-display text-lg font-bold text-gold-700">{data.attendance.late}</p>
                    <p className="text-[10px] text-ink-400">متأخر (نصف)</p>
                  </div>
                  <div className="rounded-xl border border-brand-900/10 bg-white/65 px-3 py-2">
                    <p className="font-display text-lg font-bold text-ember-600">{data.attendance.absent}</p>
                    <p className="text-[10px] text-ink-400">غائب</p>
                  </div>
                  <div className="rounded-xl border border-brand-900/10 bg-white/65 px-3 py-2">
                    <p className="font-display text-lg font-bold text-ink-500">{data.attendance.cancelled}</p>
                    <p className="text-[10px] text-ink-400">محاضرة ملغاة</p>
                  </div>
                </div>
                {(() => {
                  const allowed = Math.floor((data.attendance.past - data.attendance.cancelled) * (1 - threshold / 100));
                  const remaining = allowed - data.attendance.absent;
                  return data.attendance.past > 0 ? (
                    <p
                      className={`rounded-xl px-3 py-2 text-center text-[11px] font-bold ${
                        remaining <= 0
                          ? 'bg-ember-500/[0.08] text-ember-600'
                          : remaining <= 2
                            ? 'bg-gold-400/[0.10] text-gold-800'
                            : 'bg-lime-500/[0.08] text-lime-700'
                      }`}
                    >
                      {remaining <= 0
                        ? '⚠️ دخلت منطقة الحرمان — نسبة حضورك تحت 75%'
                        : `باقي لك ${remaining} غياب وتدخل في الحرمان`}
                    </p>
                  ) : null;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روابط سريعة</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link
                  href="/student/tasks"
                  className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
                >
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">المهام والتسليمات</span>
                    <span className="block truncate text-xs text-ink-400">حلول أسبوعية وشهرية</span>
                  </span>
                </Link>
                <Link
                  href="/student/schedule"
                  className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
                >
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">الجدول الأسبوعي</span>
                    <span className="block truncate text-xs text-ink-400">حصص جروبك كاملة</span>
                  </span>
                </Link>
                <Link
                  href="/student/lectures"
                  className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/605 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
                >
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">قسم المحاضرات</span>
                    <span className="block truncate text-xs text-ink-400">ترم أول · ترم تاني · جروب أ/ب</span>
                  </span>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      {scanOpen ? (
        <QRScanner onResult={handleScanResult} onClose={handleScanClose} />
      ) : null}

      <GpaEntryModal
        open={gpaOpen}
        onClose={() => setGpaOpen(false)}
        onSaved={() => {
          void load();
        }}
      />
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
