'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, RefreshCw, ScrollText, Search, UserRound } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Pager } from '@/components/admin/Pager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/constants';

type Row = {
  id: string;
  userId: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
};

const PAGE_SIZE = 50;

function fmt(iso: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(iso));
}

function EntityArabic(entity: string) {
  const map: Record<string, string> = {
    User: 'مستخدم',
    Course: 'مقرر',
    ScheduleSlot: 'كارت جدول',
    Lecture: 'محاضرة',
    Attendance: 'حضور',
    Grade: 'درجة',
    Task: 'تكاسك',
    TaskSubmission: 'تسليم',
    Resource: 'ملف',
    AppSetting: 'إعداد',
    Enrollment: 'تسجيل مقرر',
  };
  return map[entity] ?? entity;
}

function prettyDetail(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default function AuditPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState('');
  const [entity, setEntity] = React.useState('');
  const [role, setRole] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [openId, setOpenId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (action) params.set('action', action);
      if (entity) params.set('entity', entity);
      if (role) params.set('role', role);
      const data = await api<{ rows: Row[]; total: number }>(`/api/admin/audit?${params}`);
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, action, entity, role]);

  React.useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [action, entity, role]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inputCls = 'h-10 rounded-xl border border-brand-900/10 bg-white/60 px-3 text-sm text-ink-950 placeholder:text-ink-300';

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">سجل التدقيق</h1>
          <p className="mt-1 text-ink-500">كل عملية حساسة موثقة — مين وأيه وإمتى</p>
        </div>
        <button
          onClick={() => { void load(); }}
          className="flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-xs font-semibold text-gold-700 transition hover:bg-gold-400/20"
        >
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="فلتر بالإجراء (COURSE…)"
            className={`${inputCls} w-full pr-9`}
          />
        </div>
        <input
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          placeholder="فلتر بالجهة (User…)"
          className={inputCls}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
          <option value="" className="text-black">كل الأدوار</option>
          <option value="ADMIN" className="text-black">أدمن</option>
          <option value="PROFESSOR" className="text-black">دكتور</option>
          <option value="STUDENT" className="text-black">طالب</option>
        </select>
        <span className="text-xs text-ink-400">{loading ? 'جارٍ التحميل…' : `${total} سجل`}</span>
      </div>

      <Card className="border-brand-900/10 bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ink-950">
            <ScrollText size={18} className="text-gold-700" /> الأرشيف الزمني (الأحدث أولًا)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {rows.map((row, i) => {
              const detail = prettyDetail(row.detail);
              const open = openId === row.id;
              return (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="overflow-hidden rounded-xl border border-brand-900/[0.08] bg-white/605"
                >
                  <button
                    onClick={() => setOpenId(open ? null : row.id)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-right text-sm transition hover:bg-white/60"
                  >
                    <span className="rounded-md bg-gold-400/10 px-2 py-0.5 font-latin text-xs font-bold text-gold-700">
                      {row.action}
                    </span>
                    <span className="rounded-md bg-white/60 px-2 py-0.5 text-xs text-ink-500">
                      {EntityArabic(row.entity)} <span className="font-latin text-ink-400">({row.entity})</span>
                    </span>
                    {row.userRole ? (
                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <UserRound size={12} />
                        {ROLE_LABEL[row.userRole] ?? row.userRole}
                      </span>
                    ) : null}
                    <span className="mr-auto flex items-center gap-2 text-xs text-ink-400">
                      {row.ip ? <span className="font-latin text-[10px]">{row.ip}</span> : null}
                      <span>{fmt(row.createdAt)}</span>
                      <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-brand-900/[0.08] px-3 py-3">
                      {detail ? (
                        <pre
                          dir="ltr"
                          className="max-h-60 overflow-auto rounded-lg bg-[#eef6f0] p-3 text-xs leading-relaxed text-ink-600"
                        >
                          {detail}
                        </pre>
                      ) : (
                        <p className="text-xs text-ink-400">لا يوجد تفاصيل إضافية</p>
                      )}
                    </div>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
          {!loading && rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">لا توجد سجلات مطابقة للفلاتر</p>
          ) : null}
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
