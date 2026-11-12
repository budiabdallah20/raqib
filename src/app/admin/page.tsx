'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity, BookOpen, CalendarCheck, CircleUserRound, GraduationCap, Layers,
  ScrollText, Settings2, ArrowUpRight, ArrowDownRight, ClipboardList,
  FileStack, Radio, ChevronDown, Users, CheckCircle2, XCircle, ShieldCheck,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import EmergencyBanner from '@/components/shared/EmergencyBanner';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { LineChart } from '@/components/admin/LineChart';
import { DonutChart } from '@/components/admin/DonutChart';
import { RankBars } from '@/components/admin/RankBars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/constants';

type Stats = {
  totals: { students: number; professors: number; courses: number; slots: number; taskCount: number };
  attendance: { presentCount: number; totalPossible: number; attendancePct: number | null };
  attendSeries: { date: string; count: number }[];
  levelDist: { level: string; count: number }[];
  courseRank: { top: RankRow[]; bottom: RankRow[] };
  activities: ActivityRow[];
  files: { total: number; byKind: { kind: string; count: number }[] };
  lectures: { total: number; open: number; cancelled: number; closed: number };
  liveNow: {
    id: string;
    title: string;
    location: string | null;
    startsAt: string;
    courseCode: string;
    present: number;
  }[];
  recentSessions: RecentSession[];
};

type RankRow = {
  course: { code: string; name: string };
  presentCount: number;
  pct: number | null;
};

type ActivityRow = {
  id: string;
  action: string;
  entity: string;
  detail: string | null;
  userRole: string | null;
  createdAt: string;
};

type RecentSession = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  isOpen: boolean;
  cancelled: boolean;
  courseCode: string;
  courseName: string;
  enrolled: number;
  attended: number;
  absent: number;
};

type SessionDetail = {
  lecture: { id: string; courseCode: string; courseName: string; enrolled: number; cancelled: boolean; isOpen: boolean };
  present: { id: string; name: string; studentCode: string | null }[];
  absent: { id: string; name: string; studentCode: string | null }[];
  excused: { id: string; name: string; studentCode: string | null }[];
};

const QUICK_LINKS = [
  { href: '/admin/pulse', label: 'نبض المنصة', icon: Activity },
  { href: '/admin/students', label: 'الطلاب', icon: GraduationCap },
  { href: '/admin/professors', label: 'الدكاترة', icon: CircleUserRound },
  { href: '/admin/courses', label: 'المقررات', icon: BookOpen },
  { href: '/admin/reports', label: 'التقارير', icon: ClipboardList },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings2 },
  { href: '/admin/audit', label: 'سجل التدقيق', icon: ScrollText },
];

const DONUT_COLORS = ['#e8ae2e', '#f8c64b', '#c88e1b', '#9c6b12', '#b4862c'];
const FILE_COLORS: Record<string, string> = {
  PDF: '#e8ae2e',
  PPT: '#c88e1b',
  DOC: '#f8c64b',
  ZIP: '#9c6b12',
};

function fileColor(kind: string, index: number) {
  return FILE_COLORS[kind.toUpperCase()] ?? DONUT_COLORS[index % DONUT_COLORS.length];
}

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function formatSessionTime(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function liveMinutesSince(startsAt: string) {
  const diff = Date.now() - new Date(startsAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes <= 0) return 'انطلقت للتو';
  if (minutes < 60) return `جارية منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  return `جارية منذ ${hours} ساعة و${minutes % 60} دقيقة`;
}

export default function AdminPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState('');
  const [openSessionId, setOpenSessionId] = React.useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = React.useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState('');

  const load = React.useCallback(() => {
    api<Stats>('/api/admin/stats')
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  React.useEffect(() => {
    load();
    // مزامنة حيّة كل 20 ثانية + عند العودة للنافذة (عهد القاعدة الحية §1.3)
    const timer = window.setInterval(load, 20_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  async function toggleSession(sessionId: string) {
    if (openSessionId === sessionId) {
      setOpenSessionId(null);
      setSessionDetail(null);
      setDetailError('');
      return;
    }
    setOpenSessionId(sessionId);
    setSessionDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const detail = await api<SessionDetail>(`/api/admin/sessions/${sessionId}`);
      setSessionDetail(detail);
    } catch (err) {
      setDetailError((err as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <DashboardShell>
      <EmergencyBanner />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">لوحة الأدمن</h1>
          <p className="mt-1 text-ink-500">نظرة شاملة على المنصة — حضور، مقررات، سجل تدقيق</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-xs font-semibold text-gold-700 transition hover:bg-gold-400/20"
            >
              <link.icon size={14} />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {error ? (
        <p className="mb-6 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}

      {!stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── الكروت الكبيرة ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard title="الطلاب" value={stats.totals.students} icon={GraduationCap} tone="gold" hint="حساب طالب مسجل" />
            <AdminStatCard title="الدكاترة" value={stats.totals.professors} icon={CircleUserRound} tone="neutral" hint="حساب دكتور مسجل" />
            <AdminStatCard title="المقررات" value={stats.totals.courses} icon={BookOpen} tone="neutral" hint={`${stats.totals.slots} كروت جدول`} />
            <AdminStatCard
              title="نسبة الحضور"
              value={stats.attendance.attendancePct === null ? '—' : `${stats.attendance.attendancePct}%`}
              icon={CalendarCheck}
              tone={stats.attendance.attendancePct !== null && stats.attendance.attendancePct < 60 ? 'ember' : 'gold'}
              hint={`${stats.attendance.presentCount} تسجيل حضور من ${stats.attendance.totalPossible} ممكن`}
            />
          </div>

          {/* ── الصف الجديد: ملفات · محاضرات · حية الآن ── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* عدّاد الملفات الكلي بتوزيع الأنواع */}
            <Card className="border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-ink-950">
                  <span className="flex items-center gap-2">
                    <FileStack size={18} className="text-gold-700" />
                    ملفات المنصة
                  </span>
                  <span className="rounded-full bg-gold-400/10 px-2.5 py-0.5 text-xs font-bold text-gold-700">
                    {stats.files.total} ملف
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.files.total === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-400">لا توجد ملفات مرفوعة بعد</p>
                ) : (
                  <DonutChart
                    size={150}
                    centerLabel="ملف"
                    slicePrefix=""
                    slices={stats.files.byKind.map((row, i) => ({
                      label: row.kind,
                      count: row.count,
                      color: fileColor(row.kind, i),
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            {/* عدّاد المحاضرات المنشأة */}
            <Card className="border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <CalendarCheck size={18} className="text-gold-700" />
                  المحاضرات المنشأة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-ink-950">{stats.lectures.total}</span>
                  <span className="text-sm text-ink-400">محاضرة على مستوى المنصة</span>
                </div>
                <div className="space-y-2">
                  <ChipLine tone="live" label="مفتوحة الآن" value={stats.lectures.open} pulse={stats.lectures.open > 0} />
                  <ChipLine tone="closed" label="مغلقة" value={stats.lectures.closed} />
                  <ChipLine tone="cancelled" label="ملغاة" value={stats.lectures.cancelled} />
                </div>
              </CardContent>
            </Card>

            {/* شريط «محاضرات حية الآن» */}
            <Card
              className={
                stats.liveNow.length > 0
                  ? 'border-gold-400/40 bg-white/70 shadow-[0_0_28px_-10px_rgba(232,174,46,0.45)]'
                  : 'border-brand-900/10 bg-white/70'
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <Radio size={18} className={stats.liveNow.length > 0 ? 'animate-pulse text-ember-600' : 'text-ink-400'} />
                  محاضرات حية الآن
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.liveNow.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-400">لا توجد محاضرة حية في هذه اللحظة</p>
                ) : (
                  <div className="space-y-3">
                    {stats.liveNow.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="rounded-xl border border-gold-400/30 bg-gold-400/[0.06] p-3 transition hover:border-gold-400/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-500 opacity-60" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ember-500" />
                          </span>
                          <span className="rounded-md bg-ink-950 px-2 py-0.5 font-latin text-[10px] font-bold tracking-wide text-gold-300">
                            {lecture.courseCode}
                          </span>
                          <span className="min-w-0 truncate text-sm font-semibold text-ink-900">{lecture.title}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                          {lecture.location ? <span>قاعة {lecture.location}</span> : null}
                          <span>{liveMinutesSince(lecture.startsAt)}</span>
                          <span className="font-bold text-gold-700">{lecture.present} حاضر</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── آخر جلسات الحضور بالأسماء ── */}
          <RecentSessionsCard
            sessions={stats.recentSessions}
            openId={openSessionId}
            detail={sessionDetail}
            detailLoading={detailLoading}
            detailError={detailError}
            onToggle={toggleSession}
          />

          {/* ── الرسومات ── */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <Activity size={18} className="text-gold-700" />
                  الحضور — آخر 14 يوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={stats.attendSeries} />
              </CardContent>
            </Card>

            <Card className="border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <Layers size={18} className="text-gold-700" />
                  توزيع الطلاب على الفرقه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  slices={stats.levelDist.map((row, i) => ({
                    label: row.level,
                    count: row.count,
                    color: DONUT_COLORS[i % DONUT_COLORS.length],
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── ترتيب المقررات ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <ArrowUpRight size={18} className="text-gold-700" />
                  أعلى المقررات حضورًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankBars rows={stats.courseRank.top} />
              </CardContent>
            </Card>
            <Card className="border-brand-900/10 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink-950">
                  <ArrowDownRight size={18} className="text-ember-600" />
                  أقل المقررات حضورًا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankBars rows={stats.courseRank.bottom} tone="ember" />
              </CardContent>
            </Card>
          </div>

          {/* ── آخر التدقيق ── */}
          <Card className="border-brand-900/10 bg-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-ink-950">
                <ScrollText size={18} className="text-gold-700" />
                آخر النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.activities.length === 0 ? (
                <p className="text-sm text-ink-400">لا يوجد نشاط مسجل بعد</p>
              ) : (
                stats.activities.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2 text-sm"
                  >
                    <span className="rounded-md bg-gold-400/10 px-2 py-0.5 font-latin text-xs font-bold text-gold-700">
                      {item.action}
                    </span>
                    <span className="text-ink-600">{item.entity}</span>
                    {item.userRole ? (
                      <span className="text-xs text-ink-400">{ROLE_LABEL[item.userRole] ?? item.userRole}</span>
                    ) : null}
                    <span className="mr-auto text-xs text-ink-400">{formatActivityTime(item.createdAt)}</span>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

/* ── شرائح عدّاد المحاضرات ── */
function ChipLine({
  tone,
  label,
  value,
  pulse = false,
}: {
  tone: 'live' | 'closed' | 'cancelled';
  label: string;
  value: number;
  pulse?: boolean;
}) {
  const tones = {
    live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    closed: 'border-ink-900/10 bg-ink-900/[0.04] text-ink-600',
    cancelled: 'border-ember-500/30 bg-ember-500/10 text-ember-600',
  } as const;
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${tones[tone]}`}>
      <span className="flex items-center gap-2 font-semibold">
        {pulse ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        ) : null}
        {label}
      </span>
      <span className="font-display text-lg font-bold">{value}</span>
    </div>
  );
}

/* ── جلسات الحضور الأخيرة مع تفكيم الأسماء ── */
function RecentSessionsCard({
  sessions,
  openId,
  detail,
  detailLoading,
  detailError,
  onToggle,
}: {
  sessions: RecentSession[];
  openId: string | null;
  detail: SessionDetail | null;
  detailLoading: boolean;
  detailError: string;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="border-brand-900/10 bg-white/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-ink-950">
          <Users size={18} className="text-gold-700" />
          آخر جلسات الحضور — تحليل تفصيلي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-ink-400">لا توجد جلسات محاضرات بعد — بانتظار أول جلستك الأكاديمية</p>
        ) : (
          sessions.map((session) => {
            const expanded = openId === session.id;
            const status = session.cancelled ? 'cancelled' : session.isOpen ? 'live' : 'closed';
            const statusStyles = {
              live: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
              closed: 'bg-ink-900/[0.04] text-ink-500 border-ink-900/10',
              cancelled: 'bg-ember-500/10 text-ember-600 border-ember-500/30',
            } as const;
            const statusLabel = { live: 'حية الآن', closed: 'منتهية', cancelled: 'ملغاة' } as const;
            return (
              <div key={session.id} className="overflow-hidden rounded-xl border border-brand-900/[0.08] bg-white/65">
                <button
                  type="button"
                  onClick={() => onToggle(session.id)}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-right transition hover:bg-brand-900/[0.02]"
                  aria-expanded={expanded}
                >
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusStyles[status]}`}>
                    {statusLabel[status]}
                  </span>
                  <span className="rounded-md bg-ink-950 px-2 py-0.5 font-latin text-[10px] font-bold tracking-wide text-gold-300">
                    {session.courseCode}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                    {session.title}
                  </span>
                  <span className="text-xs text-ink-400">{formatSessionTime(session.startsAt)}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-brand-900/[0.05] px-2 py-0.5 text-ink-600">
                      مسجلون {session.enrolled}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-700">
                      حضروا {session.attended}
                    </span>
                    <span className="rounded-md bg-ember-500/10 px-2 py-0.5 font-bold text-ember-600">
                      غابوا {session.absent}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-ink-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {expanded ? (
                  <div className="border-t border-brand-900/[0.06] bg-brand-900/[0.015] px-4 py-3">
                    {detailLoading ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <span key={i} className="h-7 w-28 animate-pulse rounded-full bg-brand-900/[0.06]" />
                        ))}
                      </div>
                    ) : detailError ? (
                      <p className="text-sm text-ember-600">{detailError}</p>
                    ) : detail && detail.lecture.id === session.id ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <NameDrop title="الحاضرون" icon={<CheckCircle2 size={14} />} tone="present" names={detail.present} />
                        <NameDrop title="الغائبون" icon={<XCircle size={14} />} tone="absent" names={detail.absent} />
                        <NameDrop title="المعذورون" icon={<ShieldCheck size={14} />} tone="excused" names={detail.excused} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function NameDrop({
  title,
  icon,
  tone,
  names,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'present' | 'absent' | 'excused';
  names: { id: string; name: string; studentCode: string | null }[];
}) {
  const tones = {
    present: { badge: 'text-emerald-700', chip: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700' },
    absent: { badge: 'text-ember-600', chip: 'border-ember-500/25 bg-ember-500/[0.07] text-ember-600' },
    excused: { badge: 'text-ink-500', chip: 'border-ink-900/10 bg-ink-900/[0.04] text-ink-600' },
  } as const;
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-bold ${tones[tone].badge}`}>
        {icon}
        {title} ({names.length})
      </p>
      {names.length === 0 ? (
        <p className="rounded-lg border border-dashed border-brand-900/[0.12] px-3 py-2 text-xs text-ink-400">لا أحد ضمن هذه القائمة</p>
      ) : (
        <div className="max-h-44 space-y-1.5 overflow-y-auto pl-1">
          {names.map((student) => (
            <span
              key={student.id}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${tones[tone].chip}`}
            >
              <span className="font-semibold">{student.name}</span>
              {student.studentCode ? (
                <span className="font-latin text-[10px] opacity-70">{student.studentCode}</span>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
