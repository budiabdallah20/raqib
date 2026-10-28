'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CircleUserRound, Eye, FileText, Loader2, Search, UserRoundCheck, UserRoundX } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { AdminSheet } from '@/components/admin/AdminSheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type Row = {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
  approvedAt: string | null;
  createdAt: string;
  courses: { code: string; name: string }[];
  lecturesCount: number;
};

type Details = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  approvedAt: string | null;
  createdAt: string;
  courses: { id: string; code: string; name: string; department: string; _count: { enrollments: number; lectures: number; slots: number } }[];
  lectures: { id: string; title: string; startsAt: string; isOpen: boolean; course: { code: string; name: string }; _count: { attendances: number } }[];
  resources: { id: string; originalName: string; kind: string; size: number; createdAt: string; course: { code: string } }[];
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export default function ProfessorsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ rows: Row[] }>(`/api/admin/professors${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setRows(data.rows);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function openDetails(id: string) {
    setDetailsLoading(true);
    setDetails(null);
    try {
      const data = await api<{ professor: Details }>(`/api/admin/professors?id=${encodeURIComponent(id)}`);
      setDetails(data.professor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleActive(row: Row) {
    const target = !row.isActive;
    const confirmMessage = target
      ? `تفعيل حساب الدكتور «${row.name}»؟`
      : `تعطيل حساب الدكتور «${row.name}»؟ لن يستطيع الدخول للمنصة.`;
    if (!window.confirm(confirmMessage)) return;
    setBusyId(row.id);
    setError('');
    try {
      await api('/api/admin/professors', { method: 'PATCH', body: JSON.stringify({ id: row.id, isActive: target }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const inputCls = 'h-10 rounded-xl border border-brand-900/10 bg-white/60 px-3 text-sm text-ink-950 placeholder:text-ink-300';

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-950">إدارة الدكاترة</h1>
        <p className="mt-1 text-ink-500">مقرراتهم ومحاضراتهم — وكل عملية تُسجل في سجل التدقيق</p>
      </div>

      {error ? (
        <p className="mb-6 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اسم أو بريد الدكتور…"
            className={`${inputCls} w-full pr-9`}
          />
        </div>
      </div>

      <Card className="border-brand-900/10 bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-ink-950">
            <span className="flex items-center gap-2"><CircleUserRound size={18} className="text-gold-700" /> الدكاترة</span>
            <span className="text-xs font-normal text-ink-400">{loading ? 'جارٍ التحميل…' : `${rows.length} دكتور`}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-brand-900/10 text-xs text-ink-400">
                <th className="pb-3 pl-2 font-normal">الدكتور</th>
                <th className="pb-3 font-normal">المقررات</th>
                <th className="pb-3 font-normal">عدد المحاضرات</th>
                <th className="pb-3 font-normal">الحالة</th>
                <th className="pb-3 font-normal">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-brand-900/[0.08] last:border-0"
                >
                  <td className="py-3 pl-2">
                    <p className="font-semibold text-ink-950">{row.name}</p>
                    <p className="font-latin text-xs text-ink-400">{row.email ?? '—'}</p>
                  </td>
                  <td className="py-3">
                    {row.courses.length === 0 ? (
                      <span className="text-xs text-ink-400">لا يوجد</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.courses.slice(0, 3).map((course) => (
                          <span key={course.code} className="rounded-md bg-gold-400/10 px-2 py-0.5 font-latin text-xs font-bold text-gold-700">
                            {course.code}
                          </span>
                        ))}
                        {row.courses.length > 3 ? (
                          <span className="text-xs text-ink-400">+{row.courses.length - 3}</span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-white/60 px-2 py-0.5 text-xs text-ink-600">{row.lecturesCount} محاضرة</span>
                  </td>
                  <td className="py-3">
                    {row.isActive ? (
                      <span className="rounded-full bg-lime-500/10 px-2.5 py-1 text-xs font-semibold text-brand-600">
                        نشط
                      </span>
                    ) : row.approvedAt ? (
                      <span className="rounded-full bg-ember-500/10 px-2.5 py-1 text-xs font-semibold text-ember-600">
                        موقوف
                      </span>
                    ) : (
                      <span className="rounded-full bg-gold-400/10 px-2.5 py-1 text-xs font-semibold text-gold-700">
                        بانتظار الموافقة
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={row.isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleActive(row)}
                        disabled={busyId === row.id}
                        className="gap-1.5 px-2"
                      >
                        {busyId === row.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : row.isActive ? (
                          <UserRoundX size={14} />
                        ) : (
                          <UserRoundCheck size={14} />
                        )}
                        {row.isActive ? 'تعطيل' : 'تفعيل'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDetails(row.id)} className="gap-1.5 px-2 text-ink-600">
                        <Eye size={14} /> تفاصيل
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 ? <p className="py-8 text-center text-sm text-ink-400">لا توجد نتائج مطابقة</p> : null}
        </CardContent>
      </Card>

      <AdminSheet
        open={details !== null || detailsLoading}
        onClose={() => setDetails(null)}
        title={details?.name ?? 'تفاصيل الدكتور'}
        subtitle={details?.email ?? undefined}
      >
        {detailsLoading || !details ? (
          <div className="grid place-items-center py-12 text-ink-400"><Loader2 className="animate-spin" size={26} /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Cell label="الهاتف" value={<span className="font-latin">{details.phone ?? '—'}</span>} />
              <Cell label="أضيف في" value={fmt(details.createdAt)} />
            </div>

            <section>
              <h3 className="mb-2 font-display font-bold text-ink-950">مقرراته ({details.courses.length})</h3>
              {details.courses.length === 0 ? (
                <p className="text-sm text-ink-400">لا يوجد مقررات مسندة</p>
              ) : (
                <ul className="space-y-2">
                  {details.courses.map((course) => (
                    <li key={course.id} className="rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-700">{course.name}</span>
                        <span className="font-latin text-xs font-bold text-gold-700">{course.code}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-400">
                        {course._count.enrollments} طالب · {course._count.lectures} محاضرة · {course._count.slots} كروت جدول
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-display font-bold text-ink-950">آخر المحاضرات</h3>
              {details.lectures.length === 0 ? (
                <p className="text-sm text-ink-400">لا يوجد محاضرات</p>
              ) : (
                <ul className="space-y-2">
                  {details.lectures.map((lecture) => (
                    <li key={lecture.id} className="rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-ink-700">{lecture.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${lecture.isOpen ? 'bg-gold-400/15 text-gold-700' : 'bg-white/60 text-ink-400'}`}>
                          {lecture.isOpen ? 'مفتوحة' : 'مغلقة'}
                        </span>
                      </div>
                      <p className="mt-1 font-latin text-xs text-ink-400">
                        {lecture.course.code} · {fmt(lecture.startsAt)} · {lecture._count.attendances} حضور
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-display font-bold text-ink-950">
                <FileText size={15} className="text-gold-700" /> ملفاته ({details.resources.length})
              </h3>
              {details.resources.length === 0 ? (
                <p className="text-sm text-ink-400">لا يوجد ملفات مرفوعة</p>
              ) : (
                <ul className="space-y-2">
                  {details.resources.map((res) => (
                    <li key={res.id} className="flex items-center justify-between gap-2 rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2 text-sm">
                      <span className="truncate text-ink-700">{res.originalName}</span>
                      <span className="shrink-0 font-latin text-xs text-ink-400">
                        {res.course.code} · {(res.size / 1024).toFixed(0)} KB
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </AdminSheet>
    </DashboardShell>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-900/[0.08] bg-white/65 p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-ink-700">{value}</p>
    </div>
  );
}
