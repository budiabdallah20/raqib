'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Cake,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  EyeOff,
  FileDown,
  FolderOpen,
  LayoutGrid,
  NotebookPen,
  Phone,
  QrCode,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  User,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { QRScanner } from '@/components/QRScanner';
import { AyahTicker } from '@/components/student/AyahTicker';
import { StatsCard } from '@/components/StatsCard';
import { RadialProgress } from '@/components/student/RadialProgress';
import { GpaEntryModal } from '@/components/student/GpaEntryModal';
import { ZoneBadge, zoneHint } from '@/components/student/ZoneBadge';
import { FocusBanner } from '@/components/student/FocusBanner';
import { HealthIndex } from '@/components/student/HealthIndex';
import { AbsenceRadar, type RadarRow } from '@/components/student/AbsenceRadar';
import { GpaWhatIf, type GpaCourse } from '@/components/student/GpaWhatIf';
import { StudyPlanner } from '@/components/student/StudyPlanner';
import { PomodoroTimer } from '@/components/student/PomodoroTimer';
import { NoticesFeed } from '@/components/student/NoticesFeed';
import { MiniBars } from '@/components/student/MiniCharts';
import { GridSkeleton, Skeleton } from '@/components/student/Skeletons';
import { setLiveReminder, SCAN_EVENT, openSettings } from '@/lib/commands';
import {
  moveWidget,
  resetWidgets,
  toggleWidget,
  usePortalPrefs,
  WIDGET_TITLES,
} from '@/lib/portal-prefs';
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
  policy: { attendanceThreshold: number; maxAbsence: number; lateCountsAs: number };
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
    cumulativeIsTermOnly?: boolean;
    cumulativeSource?: 'snapshots' | 'previous' | null;
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

type SummaryData = {
  policy: { attendanceThreshold: number; maxAbsence: number; lateCountsAs: number };
  summary: {
    course: { id: string; code: string; name: string };
    present: number;
    late: number;
    absent?: number;
    totalLectures: number;
    attendancePct: number | null;
    status: 'SAFE' | 'WARNING' | 'DENIED';
    statusLabel: string;
  }[];
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

// لون نقطة الدرجة: ≥75 أخضر، ≥60 ذهبي، أقل أحمر (متوافق مع zoneFor)
function gradeDotClass(total: number) {
  if (total >= 75) return 'bg-brand-400';
  if (total >= 60) return 'bg-gold-400';
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
        <path d={line} fill="none" className={rising ? 'stroke-brand-500' : 'stroke-ember-500'} strokeWidth={1.6} strokeLinecap="round" />
        {valid.map((point, index) => (
          <circle key={point.term} cx={xs[index]} cy={ys[index]} r={1.6} className={index === valid.length - 1 ? 'fill-gold-500' : rising ? 'fill-brand-500' : 'fill-ember-500'} />
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

/* ── إطار الأداة: دخول متدرج + إخفاء + تحكم في وضع الترتيب ── */
function Widget({
  id,
  index,
  editing,
  hidden,
  children,
}: {
  id: string;
  index: number;
  editing: boolean;
  hidden: boolean;
  children: React.ReactNode;
}) {
  if (hidden && !editing) return null;
  if (editing) {
    return (
      <div className="relative rounded-2xl border border-dashed border-gold-500/40 bg-gold-400/[0.04] p-2" data-widget={id}>
        <div className="absolute -top-3 left-3 z-10 flex items-center gap-1.5 rounded-xl border border-gold-500/40 bg-white/90 px-2 py-1 shadow-gold-soft backdrop-blur">
          <span className="text-[10px] font-bold text-gold-800">{WIDGET_TITLES[id] ?? id}</span>
          <button type="button" onClick={() => moveWidget(id, -1)} aria-label="أعلى" className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-900/10 text-ink-500 hover:text-ink-950">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => moveWidget(id, 1)} aria-label="أسفل" className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-900/10 text-ink-500 hover:text-ink-950">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => toggleWidget(id)} aria-label={hidden ? 'إظهار' : 'إخفاء'} className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-900/10 text-ink-500 hover:text-ember-600">
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className={hidden ? 'pointer-events-none opacity-40' : ''}>{children}</div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StudentDashboard() {
  const searchParams = useSearchParams();
  const prefs = usePortalPrefs();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [scanOpen, setScanOpen] = React.useState(false);
  const [gpaOpen, setGpaOpen] = React.useState(false);
  const [gpaPrompted, setGpaPrompted] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const handledQuery = React.useRef('');

  const load = React.useCallback(async () => {
    try {
      const [dashboard, profileData] = await Promise.all([
        api<DashboardData>('/api/student/dashboard'),
        api<ProfileData>('/api/student/profile'),
      ]);
      setData(dashboard);
      setProfile(profileData);
      setLiveReminder(
        dashboard.upcoming
          ? {
              nextAt: dashboard.upcoming.nextAt,
              title: dashboard.upcoming.title,
              course: dashboard.upcoming.code,
              room: dashboard.upcoming.room,
            }
          : null,
      );
      const summaryData = await api<SummaryData>('/api/attendance/summary').catch(() => null);
      setSummary(summaryData);
    } catch (err) {
      setError((err as Error).message);
    }
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

  // فتح السكانر من الفاصلة العائمة / لوحة الأوامر
  React.useEffect(() => {
    const openScanner = () => setScanOpen(true);
    window.addEventListener(SCAN_EVENT, openScanner);
    return () => window.removeEventListener(SCAN_EVENT, openScanner);
  }, []);

  const submitToken = React.useCallback(
    async (value: string) => {
      setError('');
      setMessage('');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // لا اتصال — نحفظه في الطابور والمزامنة تتم تلقائيًا
        const { queueOfflineScan } = await import('@/lib/portal-prefs');
        queueOfflineScan(value);
        setMessage('مفيش نت دلوقتي — الكود اتسجل محليًا وسيبعت أول ما ترجع 👌');
        setScanOpen(false);
        return;
      }
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
        const offline = (err as Error).message === 'Failed to fetch' || (err as TypeError) instanceof TypeError;
        if (offline) {
          const { queueOfflineScan } = await import('@/lib/portal-prefs');
          queueOfflineScan(value);
          setMessage('الشبكة قطعت معاك — الكود محفوظ وسيتبعت تلقائيًا 📡');
          setScanOpen(false);
          return;
        }
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
  const threshold = data?.policy.attendanceThreshold ?? 75; // سياسة الحضور من إعدادات الأدمن

  const loadingState = !data || !profile;

  // بيانات مشتقة للأدوات
  const gradesPct = React.useMemo(() => {
    if (!profile) return null;
    const totals = profile.courses.filter((course) => course.total !== null).map((course) => course.total as number);
    return totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
  }, [profile]);

  const radarRows: RadarRow[] = React.useMemo(() => {
    if (!summary) return [];
    return summary.summary
      .filter((row) => row.totalLectures > 0)
      .map((row) => ({
        code: row.course.code,
        name: row.course.name,
        totalLectures: row.totalLectures,
        present: row.present,
        late: row.late,
        status: row.status,
        attendancePct: row.attendancePct,
      }));
  }, [summary]);

  const gpaCourses: GpaCourse[] = React.useMemo(() => {
    if (!profile) return [];
    return profile.courses.map((course) => ({
      code: course.code,
      name: course.name,
      creditHours: course.creditHours,
      components: course.components,
      total: course.total,
      graded: course.graded,
      complete: course.complete,
    }));
  }, [profile]);

  const plannerCourses = React.useMemo(() => {
    if (!profile) return [];
    return profile.courses.map((course) => ({ code: course.code, name: course.name, creditHours: course.creditHours }));
  }, [profile]);

  const attBars = React.useMemo(() => {
    if (!summary) return [];
    return summary.summary
      .filter((row) => row.totalLectures > 0)
      .map((row) => ({
        label: row.course.code,
        sub: row.course.name,
        pct: row.attendancePct,
      }));
  }, [summary]);

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">لوحة الطالب</h1>
          <p className="mt-1 text-ink-500">يومك الدراسي كامل — مركب ومصنّف بطريقتك</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing((value) => !value)} aria-pressed={editing}>
            <SlidersHorizontal className="h-4 w-4" />
            {editing ? 'خلص الترتيب' : 'ترتيب اللوحة'}
          </Button>
          <Link href="/student/report">
            <Button variant="outline">
              <FileDown className="h-4 w-4" />
              تقريري
            </Button>
          </Link>
          <Button onClick={() => setScanOpen(true)}>
            <QrCode className="h-4 w-4" />
            تسجيل حضور
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mb-5 rounded-2xl border border-gold-400/35 bg-gold-400/[0.07] p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-gold-800">
            <LayoutGrid className="h-4 w-4" />
            رتّب أدواتك بالأسهم، خبّي اللي مش بتستخدمه — الحفظ تلقائي على جهازك
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={resetWidgets}>
              <RotateCcw className="h-3.5 w-3.5" />
              رجّع الترتيب الافتراضي
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              تمام، خلصت
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-brand-500/25 bg-brand-500/[0.08] px-4 py-3 text-sm text-brand-700">
          {message}
        </p>
      ) : null}

      {loadingState ? (
        !error ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-3xl" />
              <GridSkeleton cards={6} />
            </div>
            <div className="space-y-6">
              <CardSkeletonUsage />
            </div>
          </div>
        ) : null
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* العمود الرئيسي — أدوات مرتبة باختيار الطالب */}
          <div className="space-y-6">
            {prefs.widgetOrder.map((id, index) => (
              <Widget
                key={id}
                id={id}
                index={index}
                editing={editing}
                hidden={prefs.hiddenWidgets.includes(id)}
              >
                {renderWidget(id)}
              </Widget>
            ))}
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
                    <p className="font-display text-lg font-bold text-brand-700">{data.attendance.present}</p>
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
                            : 'bg-brand-500/[0.08] text-brand-700'
                      }`}
                    >
                      {remaining <= 0
                        ? `⚠️ دخلت منطقة الحرمان — نسبة حضورك تحت ${threshold}%`
                        : `باقي لك ${remaining} غياب وتدخل في الحرمان`}
                    </p>
                  ) : null;
                })()}
                {attBars.length ? (
                  <div className="border-t border-brand-900/10 pt-3">
                    <p className="mb-2 text-[10px] font-bold text-ink-400">نسبة الحضور بالمقررات</p>
                    <MiniBars items={attBars} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روابط سريعة</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <QuickLink href="/student/tasks" icon={ClipboardList} title="المهام والتسليمات" sub="حلول أسبوعية وشهرية" />
                <QuickLink href="/student/schedule" icon={CalendarDays} title="الجدول الأسبوعي" sub={`حصص جروبك · ${todayName}`} />
                <QuickLink href="/student/notes" icon={NotebookPen} title="مذكرة الملاحظات" sub="اكتب وثبت ملاحظاتك للمواد" />
                <QuickLink href="/student/materials" icon={FolderOpen} title="ملفات المقررات" sub="مذكرات وشرح الدكاترة" />
                <QuickLink href="/student/lectures" icon={CalendarClock} title="سجل المحاضرات" sub="حضورك في كل محاضرة" />
                <button
                  type="button"
                  onClick={openSettings}
                  className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-4 text-right transition duration-300 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
                >
                  <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                    <Settings2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">أدوات العرض</span>
                    <span className="block truncate text-xs text-ink-400">الوضع الليلي · الخط · التباين · تنبيهات</span>
                  </span>
                </button>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      {scanOpen ? <QRScanner onResult={handleScanResult} onClose={handleScanClose} /> : null}

      <GpaEntryModal
        open={gpaOpen}
        onClose={() => setGpaOpen(false)}
        onSaved={() => {
          void load();
        }}
      />
    </StudentShell>
  );

  /* ── بناء الأداة حسب المعرف ── */
  function renderWidget(id: string): React.ReactNode {
    if (loadingState || !data || !profile) return null;
    switch (id) {
      case 'profile':
        return profileCard();
      case 'focus':
        return (
          <FocusBanner
            name={data.me.name}
            upcoming={
              data.upcoming
                ? {
                    title: data.upcoming.title,
                    code: data.upcoming.code,
                    kind: data.upcoming.kind,
                    room: data.upcoming.room,
                    time: data.upcoming.time,
                    daysUntil: data.upcoming.daysUntil,
                  }
                : null
            }
            lateTasks={data.stats.lateTasks}
          />
        );
      case 'health':
        return (
          <div className="grid gap-6 xl:grid-cols-2">
            <HealthIndex attendancePct={data.attendance.weightedPct} gradesPct={gradesPct} />
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>نبض اللوحة</CardTitle>
                <span className="rounded-full border border-brand-500/20 bg-brand-500/[0.07] px-2.5 py-1 text-[10px] font-bold text-brand-700">
                  Term {data.activeTerm}
                </span>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                <MiniStat icon={BookOpen} label="مقرراتك" value={data.stats.courses} tone="text-brand-700" />
                <MiniStat icon={ClipboardList} label="تسليمات متأخرة" value={data.stats.lateTasks} tone={data.stats.lateTasks ? 'text-ember-600' : 'text-ink-500'} />
                <MiniStat icon={TrendingUp} label="متوسط الميدترم" value={data.stats.midtermScores === null ? '—' : data.stats.midtermScores} tone="text-gold-700" />
                <MiniStat
                  icon={Award}
                  label="ترتيبك التراكمي"
                  value={profile.levelRank ? `${profile.levelRank.rank}/${profile.levelRank.of}` : '—'}
                  tone="text-gold-700"
                />
              </CardContent>
            </Card>
          </div>
        );
      case 'radar':
        return <AbsenceRadar rows={radarRows} policy={data.policy} loading={!summary} />;
      case 'upcoming':
        if (!data.upcoming) return null;
        return (
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
        );
      case 'today':
        return (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>محاضرات النهاردة · {todayName}</CardTitle>
              <Link href="/student/schedule" className="text-[11px] font-bold text-gold-700 hover:underline">
                الجدول كامل ←
              </Link>
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
                          : 'border-brand-900/10 bg-white/65'
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
                <div className="py-4 text-center">
                  <p className="rounded-2xl border border-dashed border-brand-500/20 bg-brand-500/[0.04] py-6 text-sm font-bold text-ink-500">
                    ☕ مفيش محاضرات النهاردة — يوم راحة، راجع مع البومودورو
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'tiles':
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/student/schedule" className="group">
              <QuickTile icon={CalendarDays} title="جدول اليوم" sub={data.todayLectures.length ? `${data.todayLectures.length} حصص — ${todayName}` : 'مفيش حصص النهاردة'} />
            </Link>
            <Link href="/student/tasks" className="group">
              <QuickTile
                icon={ClipboardList}
                title="التكليفات المعلقة"
                sub={data.stats.lateTasks > 0 ? 'عليك تسليمات فات موعدها' : 'مفيش تكليفات متأخرة'}
                badge={data.stats.lateTasks > 0 ? `${data.stats.lateTasks} متأخرة` : undefined}
              />
            </Link>
            <button type="button" onClick={() => setScanOpen(true)} className="text-right">
              <QuickTile icon={QrCode} title="كود حضور المحاضرة" sub="سكان كود أو رمز يدوي" />
            </button>
            <Link href="/student/report" className="group">
              <QuickTile icon={FileDown} title="تقرير الأداء" sub="ملخص + تصدير CSV يفتح في Excel" />
            </Link>
          </div>
        );
      case 'analytics':
        return (
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
              {profile.courses.map((course, index) => {
                const zone = course.total === null ? null : zoneFor(course.total);
                return (
                  <motion.div
                    key={course.code}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Card className="border-glow">
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
                                  : 'bg-brand-500/[0.08] text-brand-700'
                            }`}
                          >
                            {zoneHint(zone)}
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
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      case 'whatif':
        return <GpaWhatIf courses={gpaCourses} currentTermGpa={profile.gpa.term} />;
      case 'curve':
        return (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>منحنى تطور معدلك</CardTitle>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                مقارنة بالترمات السابقة
              </span>
            </CardHeader>
            <CardContent>
              <CurveChart points={profile.curve} />
            </CardContent>
          </Card>
        );
      case 'planner':
        return <StudyPlanner courses={plannerCourses} />;
      case 'pomodoro':
        return <PomodoroTimer courses={plannerCourses} />;
      case 'grades':
        return (
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
                      className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-4"
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
        );
      case 'notices':
        return <NoticesFeed />;
      default:
        return null;
    }
  }

  /* كارت البروفايل الفخم — كجزء ثابت أعلى العمود الرئيسي */
  function profileCard(): React.ReactNode {
    if (!data || !profile) return null;
    return (
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
                labelText={profile.gpa.cumulativeIsTermOnly ? 'حتى الترم الحالي' : 'تراكمي'}
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
    );
  }

  function CardSkeletonUsage() {
    return (
      <div className="space-y-6">
        <Card className="border-gold-400/25 shadow-gold-soft">
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="h-20 w-20 rounded-3xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="hidden gap-4 sm:flex">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }
}

function QuickTile({
  icon: Icon,
  title,
  sub,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  badge?: string;
}) {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/45 hover:bg-gold-400/[0.06]">
      {badge ? (
        <span className="absolute -top-1.5 left-3 rounded-full bg-ember-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{title}</span>
        <span className="block text-xs text-ink-400">{sub}</span>
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/45 hover:bg-gold-400/[0.06]"
    >
      <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-400">{sub}</span>
      </span>
    </Link>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-brand-900/10 bg-white/65 px-3 py-2.5">
      <span className={`shrink-0 ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base font-black text-ink-950">{value}</span>
        <span className="block truncate text-[9.5px] text-ink-400">{label}</span>
      </span>
    </div>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-ink-400">جارٍ التحميل...</div>}>
      <StudentDashboard />
    </Suspense>
  );
}
