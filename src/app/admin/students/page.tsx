'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Download, GraduationCap, Search, UserRoundCheck, UserRoundX, Loader2, Eye,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { AdminSheet } from '@/components/admin/AdminSheet';
import { Pager } from '@/components/admin/Pager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type Row = {
  id: string;
  name: string;
  studentCode: string | null;
  email: string | null;
  phone: string | null;
  group: string | null;
  level: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  coursesCount: number;
  courses: { code: string }[];
};

type Details = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  studentCode: string | null;
  group: string | null;
  level: string | null;
  nationalId: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  attendancePct: number | null;
  attendedCount: number;
  possibleLectures: number;
  enrollments: { course: { id: string; code: string; name: string; professor: { name: string } } }[];
  grades: { quiz: number | null; work: number | null; midterm: number | null; updatedAt: string; course: { code: string; name: string } }[];
  attendances: { status: string; scannedAt: string; lecture: { title: string; course: { code: string } } }[];
};

const PAGE_SIZE = 10;

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export default function StudentsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [group, setGroup] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (q) params.set('q', q);
      if (level) params.set('level', level);
      if (group) params.set('group', group);
      const data = await api<{ rows: Row[]; total: number }>(`/api/admin/students?${params}`);
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, q, level, group]);

  React.useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  React.useEffect(() => {
    setPage(1);
  }, [q, level, group]);

  async function openDetails(id: string) {
    setDetailsLoading(true);
    setDetails(null);
    try {
      const data = await api<{ student: Details }>(`/api/admin/students?id=${id}`);
      setDetails(data.student);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleActive(row: Row) {
    const target = !row.isActive;
    const confirmMessage = target
      ? `تفعيل حساب الطالب «${row.name}»؟`
      : `تعطيل حساب الطالب «${row.name}»؟ لن يستطيع الدخول للمنصة.`;
    if (!window.confirm(confirmMessage)) return;
    setBusyId(row.id);
    setError('');
    try {
      await api('/api/admin/students', { method: 'PATCH', body: JSON.stringify({ id: row.id, isActive: target }) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const header = ['الاسم', 'الرقم الجامعي', 'البريد', 'الهاتف', 'الجروب', 'الفرقة', 'الحالة', 'عدد المقررات', 'أضيف في'];
    const lines = rows.map((r) => [
      r.name, r.studentCode ?? '', r.email ?? '', r.phone ?? '',
      r.group ?? '', r.level ?? '', r.isActive ? 'نشط' : 'معطل',
      String(r.coursesCount), r.createdAt,
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raqib-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const inputCls = 'h-10 rounded-xl border border-brand-900/10 bg-white/60 px-3 text-sm text-ink-950 placeholder:text-ink-300';

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">إدارة الطلاب</h1>
          <p className="mt-1 text-ink-500">بحث، فلاتر، تفعيل/تعطيل — وكل عملية تُسجل في سجل التدقيق</p>
        </div>
        <Button onClick={exportCsv} disabled={rows.length === 0} className="gap-2">
          <Download size={16} /> تصدير CSV
        </Button>
      </div>

      {error ? (
        <p className="mb-6 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="اسم / رقم جامعي / هاتف…"
            className={`${inputCls} w-full pr-9`}
          />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
          <option value="" className="text-black">كل الفرق</option>
          {['1', '2', '3', '4'].map((l) => (
            <option key={l} value={l} className="text-black">الفرقة {l}</option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className={inputCls}>
          <option value="" className="text-black">كل الجروبات</option>
          <option value="A" className="text-black">جروب A</option>
          <option value="B" className="text-black">جروب B</option>
        </select>
      </div>

      <Card className="border-brand-900/10 bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-ink-950">
            <span className="flex items-center gap-2"><GraduationCap size={18} className="text-gold-700" /> الطلاب</span>
            <span className="text-xs font-normal text-ink-400">{loading ? 'جارٍ التحميل…' : `${total} طالب`}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead>
              <tr className="border-b border-brand-900/10 text-xs text-ink-400">
                <th className="pb-3 pl-2 font-normal">الطالب</th>
                <th className="pb-3 font-normal">التواصل</th>
                <th className="pb-3 font-normal">الفرقة / جروب</th>
                <th className="pb-3 font-normal">المقررات</th>
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
                    <div className="flex items-center gap-3">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatarUrl} alt={row.name} className="h-9 w-9 rounded-full border border-gold-400/30 object-cover" />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400/10 font-display font-bold text-gold-700">
                          {row.name.slice(0, 1)}
                        </span>
                      )}
                      <div>
                        <p className="font-semibold text-ink-950">{row.name}</p>
                        <p className="font-latin text-xs text-ink-400">{row.studentCode ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-ink-500">
                    <p>{row.email ?? '—'}</p>
                    <p className="font-latin">{row.phone ?? '—'}</p>
                  </td>
                  <td className="py-3 text-ink-600">
                    {row.level ? `فرقة ${row.level}` : '—'} · {row.group ? `جروب ${row.group}` : '—'}
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-white/60 px-2 py-0.5 text-xs text-ink-600">{row.coursesCount} مقرر</span>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.isActive ? 'bg-lime-500/10 text-brand-600' : 'bg-ember-500/10 text-ember-600'}`}>
                      {row.isActive ? 'نشط' : 'معطل'}
                    </span>
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
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </CardContent>
      </Card>

      <AdminSheet
        open={details !== null || detailsLoading}
        onClose={() => { setDetails(null); }}
        title={details?.name ?? 'تفاصيل الطالب'}
        subtitle={details?.studentCode ? `الرقم الجامعي ${details.studentCode}` : undefined}
      >
        {detailsLoading || !details ? (
          <div className="grid place-items-center py-12 text-ink-400"><Loader2 className="animate-spin" size={26} /></div>
        ) : (
          <StudentDetails data={details} />
        )}
      </AdminSheet>
    </DashboardShell>
  );
}

function StudentDetails({ data }: { data: Details }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoCell label="الفرقة" value={data.level ? `فرقة ${data.level}` : '—'} />
        <InfoCell label="الجروب" value={data.group ? `جروب ${data.group}` : '—'} />
        <InfoCell label="الهاتف" value={<span className="font-latin">{data.phone ?? '—'}</span>} />
        <InfoCell label="البريد" value={<span className="font-latin text-xs">{data.email ?? '—'}</span>} />
        <InfoCell label="الحالة" value={data.isActive ? 'نشط' : 'معطل'} />
        <InfoCell label="أضيف في" value={fmt(data.createdAt)} />
      </div>

      <div className="rounded-2xl border border-gold-400/20 bg-gold-400/5 p-4 text-center">
        <p className="text-xs text-ink-500">نسبة الحضور</p>
        <p className="font-display text-4xl font-bold text-gold-700">
          {data.attendancePct === null ? '—' : `${data.attendancePct}%`}
        </p>
        <p className="mt-1 text-xs text-ink-400">
          {data.attendedCount} حضور من {data.possibleLectures} محاضرة ممكنة
        </p>
      </div>

      <section>
        <h3 className="mb-2 font-display font-bold text-ink-950">المقررات ({data.enrollments.length})</h3>
        {data.enrollments.length === 0 ? (
          <p className="text-sm text-ink-400">غير مسجل في أي مقرر</p>
        ) : (
          <ul className="space-y-2">
            {data.enrollments.map(({ course }) => (
              <li key={course.id} className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/605 px-3 py-2 text-sm">
                <span className="text-ink-700">{course.name}</span>
                <span className="font-latin text-xs text-gold-700">{course.code}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-display font-bold text-ink-950">آخر الدرجات</h3>
        {data.grades.length === 0 ? (
          <p className="text-sm text-ink-400">لا يوجد درجات مسجلة</p>
        ) : (
          <ul className="space-y-2">
            {data.grades.slice(0, 6).map((g) => (
              <li key={`${g.course.code}-${g.updatedAt}`} className="rounded-xl border border-brand-900/[0.08] bg-white/605 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-latin text-xs font-bold text-gold-700">{g.course.code}</span>
                  <span className="text-xs text-ink-400">تحديث {fmt(g.updatedAt)}</span>
                </div>
                <div className="mt-1 flex gap-4 text-ink-700">
                  <span>كويز: <b>{g.quiz ?? '—'}</b></span>
                  <span>أعمال: <b>{g.work ?? '—'}</b></span>
                  <span>ميدترم: <b>{g.midterm ?? '—'}</b></span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-display font-bold text-ink-950">آخر سجلات الحضور</h3>
        {data.attendances.length === 0 ? (
          <p className="text-sm text-ink-400">لا يوجد سجلات حضور</p>
        ) : (
          <ul className="space-y-2">
            {data.attendances.map((a, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/605 px-3 py-2 text-sm">
                <span className="text-ink-700">{a.lecture.course.code} — {a.lecture.title}</span>
                <span className="text-xs text-ink-400">{fmt(a.scannedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-900/[0.08] bg-white/605 p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-ink-700">{value}</p>
    </div>
  );
}
