'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  CircleUserRound,
  GraduationCap,
  Info,
  Printer,
  RefreshCw,
  Server,
  Wifi,
  CalendarClock,
  Radio,
  Download,
  ShieldAlert,
  ScrollText,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import EmergencyBanner from '@/components/shared/EmergencyBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toCSV, downloadBlob } from '@/lib/exporters';

type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

type Pulse = {
  generatedAt: string;
  db: { ok: boolean; latencyMs: number };
  counts: {
    students: number;
    professors: number;
    courses: number;
    lecturesToday: number;
    lecturesOpen: number;
    lecturesCancelled30d: number;
    openTasks: number;
    ungradedSubmissions: number;
    lockedAccounts: number;
    failedLogins: number;
  };
  weakestLectures: {
    id: string; title: string; courseCode: string; startsAt: string;
    attended: number; expected: number; pct: number | null;
  }[];
  absenceRisk: { id: string; name: string; studentCode: string | null; absencePct: number; missed: number; expected: number }[];
  silentCourses: { id: string; code: string; name: string; lastLectureAt: string | null }[];
  anomalies: { id: string; severity: Severity; title: string; detail: string; href?: string }[];
  recentAudit: { id: string; action: string; entity: string; role: string | null; actor: string; at: string }[];
};

const SEVERITY_STYLE: Record<Severity, { wrap: string; icon: typeof AlertOctagon; label: string }> = {
  HIGH: { wrap: 'border-rose-500/35 bg-rose-500/[0.07] text-rose-800', icon: AlertOctagon, label: 'عاجل' },
  MEDIUM: { wrap: 'border-amber-500/35 bg-amber-500/[0.08] text-amber-900', icon: AlertTriangle, label: 'انتباه' },
  LOW: { wrap: 'border-sky-500/30 bg-sky-500/[0.07] text-sky-900', icon: Info, label: 'معلومة' },
};

const REFRESH_MS = 15_000;

export default function AdminPulsePage() {
  const [pulse, setPulse] = React.useState<Pulse | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [now, setNow] = React.useState(() => new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await api<Pulse>('/api/admin/pulse');
      setPulse(data);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const t = setInterval(() => void load(true), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  // ساعة حية كل ثانية
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const highCount = pulse?.anomalies.filter((a) => a.severity === 'HIGH').length ?? 0;
  const mediumCount = pulse?.anomalies.filter((a) => a.severity === 'MEDIUM').length ?? 0;
  const overall =
    !pulse ? { label: 'جارٍ القياس…', cls: 'bg-ink-100 text-ink-500 border-ink-200' }
    : highCount > 0 ? { label: 'تدخل فوري مطلوب', cls: 'bg-rose-500/15 text-rose-700 border-rose-500/40' }
    : mediumCount > 0 ? { label: 'يحتاج انتباه', cls: 'bg-amber-500/15 text-amber-800 border-amber-500/40' }
    : { label: 'المنصة مستقرة', cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40' };

  const secondsSinceUpdate = pulse
    ? Math.max(0, Math.floor((now.getTime() - new Date(pulse.generatedAt).getTime()) / 1000))
    : null;

  function exportCsv() {
    if (!pulse) return;
    const header = ['الخطورة', 'العنوان', 'التفاصيل'];
    const rows = pulse.anomalies.map((a) => [SEVERITY_STYLE[a.severity].label, a.title, a.detail]);
    const riskHeader = ['الكود', 'الاسم', 'نسبة الغياب %', 'غياب', 'المتوقع'];
    const riskRows = pulse.absenceRisk.map((r) => [r.studentCode ?? '', r.name, r.absencePct, r.missed, r.expected]);
    const weakHeader = ['المقرر', 'المحاضرة', 'حضر', 'متوقع', 'النسبة %'];
    const weakRows = pulse.weakestLectures.map((l) => [l.courseCode, l.title, l.attended, l.expected, l.pct ?? '']);
    const out = [
      ['نبض المنصة — ' + new Date(pulse.generatedAt).toLocaleString('ar-EG')],
      [],
      ['== الشذوذ =='], header, ...rows, [],
      ['== الطلاب الأقرب للحرمان =='], riskHeader, ...riskRows, [],
      ['== أضعف المحاضرات =='], weakHeader, ...weakRows,
    ];
    downloadBlob(
      `raqib-pulse-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8',
      toCSV(out),
    );
  }

  return (
    <DashboardShell>
      <EmergencyBanner />

      {/* ═══ الترويسة: ساعة حية + حالة عامة + أدوات ═══ */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold-700">
            <Radio className="h-4 w-4 animate-pulse" /> غرفة العمليات · تُحدَّث تلقائيًا كل 15 ثانية
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink-950">نبض المنصة</h1>
          <p className="mt-1 text-sm text-ink-500">
            {now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className="font-mono font-bold tabular-nums text-ink-800">{now.toLocaleTimeString('ar-EG')}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold ${overall.cls}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {overall.label}
          </span>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث{secondsSinceUpdate !== null && !refreshing ? ` (منذ ${secondsSinceUpdate} ث)` : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!pulse}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-rose-700">
            <AlertOctagon className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      ) : null}

      {/* ═══ شريط المؤشرات ═══ */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'الطلاب', value: pulse?.counts.students, icon: GraduationCap, tone: 'text-gold-700 bg-gold-500/10 border-gold-500/25' },
          { label: 'الدكاترة', value: pulse?.counts.professors, icon: CircleUserRound, tone: 'text-sapphire-700 bg-sapphire-500/10 border-sapphire-500/25' },
          { label: 'المقررات', value: pulse?.counts.courses, icon: BookOpen, tone: 'text-brand-700 bg-brand-500/10 border-brand-500/25' },
          { label: 'محاضرات اليوم', value: pulse?.counts.lecturesToday, icon: CalendarClock, tone: 'text-ink-800 bg-ink-900/[0.05] border-ink-900/10' },
          { label: 'قاعات مفتوحة الآن', value: pulse?.counts.lecturesOpen, icon: Radio, tone: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25' },
          { label: 'قاعدة البيانات', value: pulse ? `${pulse.db.latencyMs}ms` : undefined, icon: Server, tone: 'text-violet-700 bg-violet-500/10 border-violet-500/25' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`rounded-2xl border p-3.5 ${tone} ${loading && value === undefined ? 'animate-pulse' : ''}`}
          >
            <Icon className="h-4 w-4 opacity-80" />
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
              {value === undefined ? '…' : value}
            </p>
            <p className="mt-0.5 text-[10px] font-bold opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* ═══ الشذوذ المكتشف تلقائيًا ═══ */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-gold-700" />
            الشذوذ المكتشف الآن
          </CardTitle>
          <span className="text-[10px] font-semibold text-ink-400">
            {pulse ? `${pulse.anomalies.length} إشارة · قواعد حتمية قابلة للتفسير` : ''}
          </span>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {pulse && pulse.anomalies.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4 md:col-span-2">
              <Wifi className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-extrabold text-emerald-800">لا شذوذ مسجل — كل المؤشرات داخل الحدود</p>
                <p className="text-[11px] text-emerald-700/80">الحضور، التسليم، الأقفال، ومحاضرات المقررات كلها سليمة.</p>
              </div>
            </div>
          ) : null}
          {pulse?.anomalies.map((anomaly) => {
            const style = SEVERITY_STYLE[anomaly.severity];
            const Icon = style.icon;
            const body = (
              <div className={`flex h-full items-start gap-3 rounded-2xl border p-3.5 transition hover:shadow-md ${style.wrap}`}>
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-70">{style.label}</p>
                  <p className="mt-0.5 text-[12.5px] font-extrabold leading-snug">{anomaly.title}</p>
                  <p className="mt-1 text-[10.5px] leading-snug opacity-80">{anomaly.detail}</p>
                </div>
              </div>
            );
            return anomaly.href ? (
              <Link key={anomaly.id} href={anomaly.href} className="block">
                {body}
              </Link>
            ) : (
              <div key={anomaly.id}>{body}</div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* ═══ أضعف المحاضرات ═══ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-gold-700" />
              أضعف المحاضرات حضورًا
            </CardTitle>
            <Link href="/admin/reports" className="text-[10px] font-bold text-gold-700 hover:underline">
              التقارير ←
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3">
            {!pulse ? <SkeletonRows /> : null}
            {pulse && pulse.weakestLectures.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">لا توجد محاضرات دون 60% حضور في آخر 30 يومًا.</p>
            ) : null}
            {pulse?.weakestLectures.map((lecture) => (
              <div key={lecture.id}>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-bold text-ink-800">
                    <span className="me-1 rounded bg-ink-900/[0.06] px-1.5 py-0.5 font-mono text-[9.5px]">{lecture.courseCode}</span>
                    {lecture.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-500">
                    {lecture.attended}/{lecture.expected} · <b className="text-ink-800">{lecture.pct}%</b>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${(lecture.pct ?? 0) < 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${lecture.pct ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ═══ الطلاب الأقرب للحرمان ═══ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-gold-700" />
              الطلاب الأقرب للحرمان
            </CardTitle>
            <Link href="/admin/students" className="text-[10px] font-bold text-gold-700 hover:underline">
              الطلاب ←
            </Link>
          </CardHeader>
          <CardContent className="grid gap-2">
            {!pulse ? <SkeletonRows /> : null}
            {pulse && pulse.absenceRisk.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">لا يوجد طالب تجاوز 50% غياب في آخر 30 يومًا.</p>
            ) : null}
            {pulse?.absenceRisk.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-brand-900/10 bg-white/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-bold text-ink-900">{row.name}</p>
                  <p className="text-[9.5px] text-ink-400">{row.studentCode || 'بدون كود'} · فاتته {row.missed} من {row.expected} محاضرة</p>
                </div>
                <span
                  className={`shrink-0 rounded-lg border px-2 py-1 font-mono text-[11px] font-extrabold tabular-nums ${
                    row.absencePct >= 75
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-700'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-800'
                  }`}
                >
                  {row.absencePct}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ═══ مقررات صامتة + سجل التدقيق ═══ */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-gold-700" />
              مقررات صامتة منذ 14 يوم
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {!pulse ? <SkeletonRows /> : null}
            {pulse && pulse.silentCourses.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-400">كل المقررات لها نشاط حديث — ممتاز.</p>
            ) : null}
            {pulse?.silentCourses.map((course) => (
              <Link
                key={course.id}
                href="/admin/courses"
                title={course.name}
                className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-3 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-500/[0.15]"
              >
                {course.code}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4 text-gold-700" />
              آخر عمليات التدقيق
            </CardTitle>
            <Link href="/admin/audit" className="text-[10px] font-bold text-gold-700 hover:underline">
              السجل كامل ←
            </Link>
          </CardHeader>
          <CardContent>
            <ol className="relative grid gap-0 border-r-2 border-brand-900/10 pr-4">
              {pulse?.recentAudit.map((entry) => (
                <li key={entry.id} className="relative pb-3 last:pb-0">
                  <span className="absolute -right-[21px] top-1.5 h-2 w-2 rounded-full border border-white bg-gold-500" />
                  <p className="text-[10px] text-ink-400">
                    {new Date(entry.at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    {' · '}{entry.actor} ({entry.role ?? '—'})
                  </p>
                  <p className="text-[11px] font-bold text-ink-800">
                    <span className="font-mono text-[9.5px] text-ink-400">{entry.action}</span>
                    {' على '}{entry.entity}
                  </p>
                </li>
              ))}
              {pulse && pulse.recentAudit.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-400">لا توجد عمليات تدقيق مسجلة بعد.</p>
              ) : null}
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function SkeletonRows() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9 animate-pulse rounded-xl bg-ink-900/[0.06]" />
      ))}
    </div>
  );
}
