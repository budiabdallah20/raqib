'use client';

import * as React from 'react';
import { Bell, CalendarClock, Loader2, Save, Settings2 } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import TermDatePicker from '@/components/admin/TermDatePicker';

type SettingsResponse = {
  settings: Record<string, string>;
  rows: { key: string; value: string; updatedAt: string }[];
};

const FIELDS = [
  {
    key: 'secondTermStart',
    label: 'تاريخ فتح الترم الثاني',
    hint: 'تاريخ بدء الترم الثاني — يستخدم في تقويم المنصة',
  },
  {
    key: 'firstTermEnd',
    label: 'نهاية الترم الأول',
    hint: 'آخر يوم في الترم الأول',
  },
] as const;

export default function SettingsPage() {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = React.useState<Record<string, string | null>>({});
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    api<SettingsResponse>('/api/admin/settings')
      .then((data) => {
        setValues(data.settings);
        const stamp: Record<string, string | null> = {};
        for (const row of data.rows) stamp[row.key] = row.updatedAt;
        setUpdatedAt(stamp);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    const value = values[key] ?? '';
    if (!value) {
      setError('اختر تاريخًا أولًا');
      return;
    }
    setError('');
    setSavingKey(key);
    try {
      const data = await api<{ setting: { key: string; updatedAt: string } }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });
      setUpdatedAt((prev) => ({ ...prev, [key]: data.setting.updatedAt }));
      setNotice('تم الحفظ وتم تسجيل العملية في سجل التدقيق');
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-950">إعدادات المنصة</h1>
        <p className="mt-1 text-ink-500">تواريخ الترم — وكل عملية حفظ تُسجل في سجل التدقيق</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-xl border border-lime-500/30 bg-lime-500/10 p-3 text-sm text-brand-600">{notice}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <CalendarClock size={18} className="text-gold-700" /> التقويم الأكاديمي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="grid place-items-center py-10 text-ink-400"><Loader2 className="animate-spin" size={24} /></div>
            ) : (
              FIELDS.map((field) => (
                <div key={field.key} className="rounded-2xl border border-brand-900/[0.08] bg-white/65 p-4">
                  <label className="block font-display font-bold text-ink-950">{field.label}</label>
                  <p className="mt-0.5 text-xs text-ink-400">{field.hint}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <TermDatePicker
                      value={values[field.key] ?? null}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                    />
                    <Button onClick={() => save(field.key)} disabled={savingKey === field.key} size="sm" className="gap-1.5">
                      {savingKey === field.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      حفظ
                    </Button>
                  </div>
                  {updatedAt[field.key] ? (
                    <p className="mt-2 text-[11px] text-ink-400">
                      آخر تحديث: {new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt[field.key]!))}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-ink-400">لم يُحدد بعد</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <Bell size={18} className="text-gold-700" /> الحالة العامة — الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-ink-500">
              قياسات الإشعارات (سلة التنبيهات، تنبيهات الدرجات والمواعيد) قيد التحضير — ستُربط في إصدار لاحق.
              الإعدادات المحفوظة حاليًا تظهر هنا مباشرة.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">تاريخ فتح الترم الثاني</span>
                <span className="font-latin text-xs font-bold text-gold-700">{values.secondTermStart ? values.secondTermStart : '—'}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">نهاية الترم الأول</span>
                <span className="font-latin text-xs font-bold text-gold-700">{values.firstTermEnd ? values.firstTermEnd : '—'}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">إشعارات الدرجات</span>
                <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-ink-400">قريبًا</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">تنبيهات المواعيد</span>
                <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-ink-400">قريبًا</span>
              </li>
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-400">
              <Settings2 size={12} /> الإصدار الأول — إعدادات مفتاح/قيمة فقط
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
