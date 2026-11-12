'use client';

import * as React from 'react';
import {
  Bell, CalendarClock, Database, Cloud, Loader2, Power, Save,
  Settings2, Wrench, ShieldCheck, CircleAlert, RefreshCw, Square, Siren, Gauge,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { QR_ROTATE_PRESETS } from '@/lib/constants';
import TermDatePicker from '@/components/admin/TermDatePicker';

type SettingsResponse = {
  settings: Record<string, string>;
  rows: { key: string; value: string; updatedAt: string }[];
};

type SystemInfo = {
  db: {
    dialect: 'postgres' | 'sqlite';
    up: boolean;
    latencyMs: number | null;
    sizeBytes: number | null;
    sizeNote: string | null;
  };
  drive: {
    configured: boolean;
    mode: 'rest' | 'rclone' | null;
    usedBytes: number | null;
    totalBytes: number | null;
  };
  generatedAt: string;
};

type BackupResponse = {
  ok: boolean;
  backup: { name: string; createdAt: string };
  previous: string | null;
  removedOld: number;
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
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  // مؤشرات الأنظمة الحية
  const [system, setSystem] = React.useState<SystemInfo | null>(null);
  const [systemLoading, setSystemLoading] = React.useState(true);
  const [backupBusy, setBackupBusy] = React.useState(false);
  const [lastBackup, setLastBackup] = React.useState<BackupResponse['backup'] | null>(null);

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

  // نبض الأنظمة الحية: كل 30 ثانية + عند العودة للنافذة (§1.3)
  const loadSystem = React.useCallback(() => {
    api<SystemInfo>('/api/admin/system')
      .then(setSystem)
      .catch(() => setSystem(null))
      .finally(() => setSystemLoading(false));
  }, []);

  React.useEffect(() => {
    loadSystem();
    const timer = window.setInterval(loadSystem, 30_000);
    window.addEventListener('focus', loadSystem);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', loadSystem);
    };
  }, [loadSystem]);

  async function runBackupNow() {
    setError('');
    setBackupBusy(true);
    try {
      const result = await api<BackupResponse>('/api/admin/system/backup', { method: 'POST' });
      setLastBackup(result.backup);
      setNotice(`تم إنشاء نسخة احتياطية حية (${result.backup.name}) — العملية موثقة في سجل التدقيق`);
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function patchSetting(key: string, value: string) {
    setError('');
    setSavingKey(key);
    try {
      const data = await api<{ setting: { key: string; updatedAt: string } }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });
      setValues((prev) => ({ ...prev, [key]: value }));
      setUpdatedAt((prev) => ({ ...prev, [key]: data.setting.updatedAt }));
      setNotice('تم الحفظ وتم تسجيل العملية في سجل التدقيق');
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  async function save(key: string) {
    const value = values[key] ?? '';
    if (!value) {
      setError('اختر تاريخًا أولًا');
      return;
    }
    await patchSetting(key, value);
  }

  async function setPlatformStatus(value: 'ONLINE' | 'MAINTENANCE') {
    // التطبيق فوري بالضغط على الوضع الجديد — بدون زر حفظ منفصل
    if (values.platformStatus === value) return;
    setError('');
    setSavingStatus(true);
    try {
      const data = await api<{ setting: { key: string; updatedAt: string } }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'platformStatus', value }),
      });
      setValues((prev) => ({ ...prev, platformStatus: value }));
      setUpdatedAt((prev) => ({ ...prev, platformStatus: data.setting.updatedAt }));
      setNotice(value === 'MAINTENANCE' ? 'تم تشغيل وضع الصيانة — الصفحة الأساسية ستعرض الحالة الجديدة خلال ثوانٍ' : 'المنصة تشغّال — الحالة تنعكس على الصفحة الأساسية خلال ثوانٍ');
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-950">إعدادات المنصة</h1>
        <p className="mt-1 text-ink-500">تواريخ الترم وحالة المنصة — وكل عملية حفظ تُسجل في سجل التدقيق</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-600">{notice}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <Power size={18} className="text-gold-700" /> حالة المنصة — تعمل الآن / صيانة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-ink-500">
              الحالة تتخزن في قاعدة البيانات (AppSetting) وتظهر مباشرة على الصفحة الأساسية في مؤشر «تعمل الآن» قبل كافة الأقسام.
            </p>
            <div className="flex gap-3" role="group" aria-label="حالة المنصة">
              <button
                type="button"
                onClick={() => setPlatformStatus('ONLINE')}
                disabled={savingStatus || loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-display text-sm font-bold transition-all disabled:opacity-60 ${
                  values.platformStatus !== 'MAINTENANCE'
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 shadow-[0_10px_30px_-16px_rgba(28,110,10,.5)]'
                    : 'border-brand-900/[0.08] bg-white/65 text-ink-400 hover:border-brand-500/25'
                }`}
              >
                <Power size={15} /> تعمل الآن
              </button>
              <button
                type="button"
                onClick={() => setPlatformStatus('MAINTENANCE')}
                disabled={savingStatus || loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-display text-sm font-bold transition-all disabled:opacity-60 ${
                  values.platformStatus === 'MAINTENANCE'
                    ? 'border-gold-500/50 bg-gold-500/10 text-gold-800 shadow-[0_10px_30px_-16px_rgba(200,162,75,.55)]'
                    : 'border-brand-900/[0.08] bg-white/65 text-ink-400 hover:border-gold-500/30'
                }`}
              >
                <Wrench size={15} /> صيانة
              </button>
            </div>
            <p className="flex items-center gap-2 text-[11px] text-ink-400">
              {savingStatus ? <Loader2 size={12} className="animate-spin" /> : null}
              الحالة الحالية: <span className={`font-latin font-bold ${values.platformStatus === 'MAINTENANCE' ? 'text-gold-700' : 'text-brand-600'}`}>{values.platformStatus === 'MAINTENANCE' ? 'MAINTENANCE' : 'ONLINE'}</span>
              {updatedAt.platformStatus
                ? ` · آخر تحديث: ${new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt.platformStatus))}`
                : ''}
            </p>
          </CardContent>
        </Card>

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

        <SystemsLiveCard system={system} loading={systemLoading} backupBusy={backupBusy} lastBackup={lastBackup} onBackupNow={runBackupNow} />

        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <RefreshCw size={18} className="text-gold-700" /> مدة دوران رمز QR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-ink-500">
              الرمز الديناميكي يتجدد بهذه المدة داخل نفس المحاضرة (WP3) ضمن جلسة الرمز الحية — الأنماط المسموحة: 5/10/15/20 ثانية، والافتراضي 10. التغيير ينعكس على كل السبورات المفتوحة خلال ثوانٍ.
            </p>
            <div className="flex flex-wrap gap-3" role="group" aria-label="مدة دوران QR">
              {QR_ROTATE_PRESETS.map((s) => {
                const active = (values.qr_rotation_seconds ?? '10') === String(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patchSetting('qr_rotation_seconds', String(s))}
                    disabled={savingKey === 'qr_rotation_seconds' || loading}
                    className={`flex min-w-[72px] flex-1 flex-col items-center justify-center rounded-2xl border px-3 py-3 font-display text-sm font-bold transition-all disabled:opacity-60 ${
                      active
                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 shadow-[0_10px_30px_-16px_rgba(28,110,10,.5)]'
                        : 'border-brand-900/[0.08] bg-white/65 text-ink-400 hover:border-brand-500/25'
                    }`}
                  >
                    <span className="font-latin text-lg">{s}</span>
                    <span className="mt-0.5 text-[10px] font-semibold">ثانية</span>
                  </button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 text-[11px] text-ink-400">
              {savingKey === 'qr_rotation_seconds' ? <Loader2 size={12} className="animate-spin" /> : null}
              النمط الحالي: <span className="font-latin font-bold text-gold-700">{values.qr_rotation_seconds ?? '10'}s</span>
              {updatedAt.qr_rotation_seconds
                ? ` · آخر تحديث: ${new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt.qr_rotation_seconds))}`
                : ' · لم يُضبط بعد (افتراضي)'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <Gauge size={18} className="text-gold-700" /> أوزان مخاطر التعثر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-ink-500">
              تغذي لوحة «المخاطر المبكرة» عند الدكتور وبوصلة المقررات عند الطالب — حساب حتمي شفاف،
              والقيم تُطبّع تلقائيًا إذا لم يجمع المجموع 1. القيم الافتراضية: حضور 0.40 · درجات 0.35 · مهام 0.25.
            </p>
            {(
              [
                { key: 'risk_w_attendance', label: 'وزن الحضور', fallback: '0.4' },
                { key: 'risk_w_grade', label: 'وزن الدرجات', fallback: '0.35' },
                { key: 'risk_w_task', label: 'وزن التسليمات', fallback: '0.25' },
              ] as const
            ).map(({ key, label, fallback }) => (
              <label key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5 text-sm">
                <span className="font-semibold text-ink-800">{label}</span>
                <span className="flex items-center gap-2">
                  <input
                    key={values[key] ?? fallback}
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={values[key] ?? fallback}
                    disabled={savingKey === key || loading}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (next && next !== (values[key] ?? fallback)) void patchSetting(key, next);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                    }}
                    className="h-9 w-20 rounded-lg border border-brand-900/15 bg-white/80 px-2 text-center font-latin text-xs font-bold text-ink-900 outline-none focus:border-gold-500/50"
                    aria-label={label}
                  />
                  {savingKey === key ? <Loader2 size={12} className="animate-spin" /> : null}
                </span>
              </label>
            ))}
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
                <span className="text-ink-700">حالة المنصة</span>
                <span className={`font-latin text-xs font-bold ${values.platformStatus === 'MAINTENANCE' ? 'text-gold-700' : 'text-brand-600'}`}>{values.platformStatus === 'MAINTENANCE' ? 'MAINTENANCE — صيانة' : 'ONLINE — تعمل'}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">إشعارات الدرجات</span>
                <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-ink-400">قريبًا</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">تنبيهات المواعيد</span>
                <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-ink-400">قريبًا</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">مدة دوران QR</span>
                <span className="font-latin text-xs font-bold text-gold-700">
                  {values.qr_rotation_seconds ? `${values.qr_rotation_seconds} ثوانٍ` : '10 ثوانٍ — افتراضي'}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">أوزان مخاطر التعثر</span>
                <span className="font-latin text-xs font-bold text-gold-700">
                  {(values.risk_w_attendance ?? '0.4')} / {(values.risk_w_grade ?? '0.35')} / {(values.risk_w_task ?? '0.25')}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">حد الساعات المعتمدة</span>
                <span className="font-latin text-xs font-bold text-gold-700">{values.credit_limit ?? '17'} ساعة</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-brand-900/[0.08] bg-white/65 px-3 py-2.5">
                <span className="text-ink-700">البث الطارئ</span>
                <span className={`font-latin text-xs font-bold ${values.emergency_banner?.trim() ? 'text-ember-600' : 'text-ink-400'}`}>
                  {values.emergency_banner?.trim() ? 'نشط الآن' : 'غير نشط'}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-brand-900/10 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ink-950">
              <Siren size={18} className="text-gold-700" /> شريط البث الطارئ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-3 text-xs leading-relaxed text-ink-500">
              نص واحد يُبَثّ فورًا في بوابات الطالب والدكتور والأدمن وعلى سبورة المحاضرة — تفريغ النص يوقف البث. حتى 300 حرف، وتُنزَّع الرموز الخاصة تلقائيًا.
            </p>
            <textarea
              value={values.emergency_banner ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, emergency_banner: e.target.value }))}
              rows={2}
              maxLength={300}
              placeholder="مثال: تأجل محاضرة MAT201 اليوم — الحصة الرابعة"
              aria-label="نص البث الطارئ"
              className="w-full resize-none rounded-xl border border-brand-900/[0.12] bg-white/70 px-3 py-2.5 text-sm leading-relaxed text-ink-950 outline-none transition focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/15 placeholder:text-ink-300"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => patchSetting('emergency_banner', values.emergency_banner ?? '')}
                disabled={savingKey === 'emergency_banner'}
                size="sm"
                className="gap-1.5"
              >
                {savingKey === 'emergency_banner' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                بث الآن
              </Button>
              <Button
                variant="outline"
                onClick={() => patchSetting('emergency_banner', '')}
                disabled={savingKey === 'emergency_banner'}
                size="sm"
                className="gap-1.5"
              >
                <Square size={12} />
                إيقاف البث
              </Button>
              <span className="ms-auto font-latin text-[11px] text-ink-400">
                {(values.emergency_banner ?? '').length}/300
              </span>
            </div>
            <p className="text-[11px] text-ink-400">
              {updatedAt.emergency_banner
                ? `آخر تحديث: ${new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt.emergency_banner))}`
                : 'لم يُبَثّ شيء بعد'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

/* ── بطاقة الأنظمة الحية: القاعدة + Drive + الزر الفوري للنسخ ── */
function SystemsLiveCard({
  system,
  loading,
  backupBusy,
  lastBackup,
  onBackupNow,
}: {
  system: SystemInfo | null;
  loading: boolean;
  backupBusy: boolean;
  lastBackup: { name: string; createdAt: string } | null;
  onBackupNow: () => void;
}) {
  const REAL_DRIVE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024 * 1024; // سعة الخطة القياسية 1TB المرجعية
  const dbQuota = system?.db.dialect === 'postgres' ? 512 * 1024 * 1024 : 512 * 1024 * 1024; // الخطط المجانية: 0.5GB (Neon) / ملف محلي

  const dbUsed = system?.db.sizeBytes ?? null;
  const dbPct = dbUsed !== null ? Math.min(100, Math.round((dbUsed / dbQuota) * 100)) : null;

  const driveUsed = system?.drive.usedBytes ?? null;
  const driveTotal = system?.drive.totalBytes ?? REAL_DRIVE_QUOTA_BYTES;
  const drivePct = driveUsed !== null && driveTotal ? Math.min(100, Math.round((driveUsed / driveTotal) * 100)) : null;

  function formatBytes(bytes: number | null) {
    if (bytes === null) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} من كيلوبايت`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} من موالب`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} من غيغا`;
  }

  return (
    <Card
      className={
        system && !system.db.up
          ? 'border-ember-500/40 bg-white/70 shadow-[0_0_24px_-12px_rgba(239,68,68,0.45)]'
          : 'border-brand-900/10 bg-white/70'
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-ink-950">
          <span className="flex items-center gap-2">
            <Database size={18} className="text-gold-700" />
            الأنظمة الحية — القاعدة والتخزين
          </span>
          {system ? (
            <span className="flex items-center gap-1.5 text-[11px] font-latin text-ink-400">
              {system.db.up ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {system.db.up ? 'up' : 'down'} · {system.db.latencyMs ?? '—'}ms
                </>
              ) : (
                <span className="flex items-center gap-1 text-ember-600">
                  <CircleAlert size={12} /> القاعدة لا تستجيب
                </span>
              )}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading || !system ? (
          <div className="grid place-items-center py-8 text-ink-400">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : (
          <>
            {/* مقياس القاعدة */}
            <div className="rounded-2xl border border-brand-900/[0.08] bg-white/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gold-400/10 px-2 py-0.5 font-latin text-[10px] font-bold text-gold-700">
                    {system.db.dialect === 'postgres' ? 'PostgreSQL · Neon' : 'SQLite · محلي'}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">مقياس التخزين</span>
                </div>
                <span className={`font-latin text-xs font-bold ${dbPct !== null && dbPct > 90 ? 'text-ember-600' : 'text-ink-500'}`}>
                  {dbUsed !== null ? `${formatBytes(dbUsed)} / ${formatBytes(dbQuota)}` : system.db.sizeNote ?? '—'}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-900/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dbPct ?? 0}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    (dbPct ?? 0) > 90
                      ? 'bg-ember-500'
                      : (dbPct ?? 0) > 70
                        ? 'bg-gold-500'
                        : 'bg-brand-500'
                  }`}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                زمن آخر استجابة: <span className="font-latin font-bold text-ink-600">{system.db.latencyMs ?? '—'}ms</span>
                {' · '}تم التوليد: {new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(system.generatedAt))}
              </p>
            </div>

            {/* مقياس Drive */}
            <div className="rounded-2xl border border-brand-900/[0.08] bg-white/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cloud size={16} className="text-gold-700" />
                  <span className="text-sm font-semibold text-ink-900">Google Drive</span>
                  {system.drive.mode ? (
                    <span className="rounded-md bg-brand-500/10 px-2 py-0.5 font-latin text-[10px] font-bold text-brand-700">
                      {system.drive.mode === 'rest' ? 'REST · OAuth' : 'rclone'}
                    </span>
                  ) : (
                    <span className="rounded-md bg-ink-900/[0.05] px-2 py-0.5 text-[10px] font-bold text-ink-500">
                      غير مُعد
                    </span>
                  )}
                </div>
                <span className="font-latin text-xs font-bold text-ink-500">
                  {driveUsed !== null
                    ? `${formatBytes(driveUsed)} / ${formatBytes(driveTotal)}`
                    : system.drive.configured
                      ? 'تعذر قياس السعة الآن'
                      : 'ثبّت الإعداد عبر npm run drive:setup'}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-900/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${drivePct ?? 0}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`h-full rounded-full ${(drivePct ?? 0) > 90 ? 'bg-ember-500' : 'bg-gold-500'}`}
                />
              </div>
            </div>

            {/* حفظ النسخة */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.05] p-4">
              <div>
                <p className="text-sm font-bold text-ink-950">نسخة احتياطية فورية</p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  {lastBackup
                    ? `آخر نسخة: ${lastBackup.name} · ${new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastBackup.createdAt))}`
                    : 'تحتفظ بآخر 20 نسخة داخل prisma/backups — والعملية تُوثَّق في سجل التدقيق'}
                </p>
              </div>
              <Button onClick={onBackupNow} disabled={backupBusy} size="sm" className="gap-1.5">
                {backupBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                أنشئ النسخة الآن
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
