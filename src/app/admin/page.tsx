'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, BookOpen, CalendarCheck, CircleUserRound, GraduationCap, Layers,
  ScrollText, Settings2, ArrowUpRight, ArrowDownRight, ClipboardList,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
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
  courseRank: {
    top: RankRow[];
    bottom: RankRow[];
  };
  activities: ActivityRow[];
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

const QUICK_LINKS = [
  { href: '/admin/students', label: 'الطلاب', icon: GraduationCap },
  { href: '/admin/professors', label: 'الدكاترة', icon: CircleUserRound },
  { href: '/admin/courses', label: 'المقررات', icon: BookOpen },
  { href: '/admin/reports', label: 'التقارير', icon: ClipboardList },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings2 },
  { href: '/admin/audit', label: 'سجل التدقيق', icon: ScrollText },
];

const DONUT_COLORS = ['#e8ae2e', '#f8c64b', '#c88e1b', '#9c6b12'];

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api<Stats>('/api/admin/stats')
      .then(setStats)
      .catch((err) => setError((err as Error).message));
  }, []);

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">لوحة الأدمن</h1>
          <p className="mt-1 text-ink-500">نظرة شاملة على المنصة — حضور، مقررات، سجل تدقيق</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-xs font-semibold text-gold-700 transition hover:bg-gold-400/20"
            >
              <link.icon size={14} />
              {link.label}
            </a>
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
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-brand-900/[0.08] bg-white/605 px-3 py-2 text-sm"
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
