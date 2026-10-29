'use client';

/**
 * 🎛 لوحة أدوات العرض والإتاحة — تفتح من حدث `raqib:settings:open`
 * أو من زر الإعدادات في الفاصلة العائمة: ثيم، حجم خط، تباين، حركة، تنبيهات، تهيئة.
 */
import * as React from 'react';
import {
  Accessibility,
  Bell,
  Contrast,
  Hand,
  Moon,
  Sun,
  Type,
  UserCog,
  Keyboard,
  X,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SETTINGS_EVENT } from '@/lib/commands';
import {
  FONT_SCALE_LABEL,
  FONT_SCALE_PCT,
  setPortalPrefs,
  usePortalPrefs,
  wipePortalPrefs,
  type FontScale,
} from '@/lib/portal-prefs';

function Switch({
  checked,
  onChange,
  label,
  icon,
  sub,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-900/10 bg-white/65 p-3.5 transition hover:border-brand-500/25">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-700">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink-900">{label}</span>
          {sub ? <span className="block truncate text-[11px] text-ink-400">{sub}</span> : null}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-brand-500' : 'bg-brand-900/[0.14]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
            checked ? 'right-auto left-0.5 translate-x-0' : 'right-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export function ThemeToolsPanel() {
  const prefs = usePortalPrefs();
  const [open, setOpen] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
    const onSettings = () => setOpen(true);
    window.addEventListener(SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(SETTINGS_EVENT, onSettings);
  }, []);

  const askPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        new Notification('تم التفعيل ✅', {
          body: 'هننبّهك قبل المحاضرة بعشر دقائق — من المؤكد ومحدش هيغلبك باقي الوصول.',
          icon: '/icon.svg',
        });
        setPortalPrefs({ reminders: true });
      }
    } catch {
      /* browsers قد ترفض بدون SW */
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[86vh] w-full max-w-md overflow-y-auto rounded-3xl border border-gold-400/30 bg-white/92 p-5 shadow-[0_40px_120px_-30px_rgba(19,56,44,0.5)] backdrop-blur-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="أدوات العرض والإتاحة"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-950">
                <Accessibility className="h-5 w-5 text-gold-700" />
                أدوات العرض والإتاحة
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/60 text-ink-400 transition hover:text-ink-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* الثيم */}
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-500">
              <Sun className="h-3.5 w-3.5" /> مظهر البوابة
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setPortalPrefs({ theme })}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                    prefs.theme === theme
                      ? theme === 'dark'
                        ? 'border-ink-950/40 bg-ink-950 text-gold-400'
                        : 'border-gold-400/50 bg-gold-400/15 text-gold-800 shadow-gold-soft'
                      : 'border-brand-900/10 bg-white/60 text-ink-500 hover:border-brand-500/25'
                  }`}
                >
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'dark' ? 'ليلي' : 'نهاري'}
                </button>
              ))}
            </div>

            {/* حجم الخط */}
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-500">
              <Type className="h-3.5 w-3.5" /> حجم الخط
            </p>
            <div className="mb-4 grid grid-cols-4 gap-1.5">
              {(Object.keys(FONT_SCALE_LABEL) as FontScale[]).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setPortalPrefs({ fontScale: scale })}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                    prefs.fontScale === scale
                      ? 'border-brand-500/40 bg-brand-500/[0.12] text-brand-700'
                      : 'border-brand-900/10 bg-white/60 text-ink-500 hover:border-brand-500/25'
                  }`}
                  style={{ fontSize: FONT_SCALE_PCT[scale] }}
                >
                  {FONT_SCALE_LABEL[scale]}
                </button>
              ))}
            </div>

            {/* مفاتيح الإتاحة */}
            <div className="space-y-2">
              <Switch
                checked={prefs.highContrast}
                onChange={(value) => setPortalPrefs({ highContrast: value })}
                label="تباين عالٍ"
                sub="نص أوضح وحدود أقشع للقراءة المريحة"
                icon={<Contrast className="h-4 w-4" />}
              />
              <Switch
                checked={prefs.reduceMotion}
                onChange={(value) => setPortalPrefs({ reduceMotion: value })}
                label="تقليل الحركة"
                sub="إيقاف الأنيميشن الزائد — مناسب للجهاز القديم"
                icon={<Hand className="h-4 w-4" />}
              />
              <Switch
                checked={prefs.reminders}
                onChange={(value) => {
                  if (value && permission !== 'granted') {
                    void askPermission();
                    return;
                  }
                  setPortalPrefs({ reminders: value });
                }}
                label="تنبيه قبل المحاضرة"
                sub={
                  permission === 'granted'
                    ? 'إشعار النظام — بعشر دقائق قبل أول محاضرة'
                    : 'محتاج صلاحية إشعارات المتصفح'
                }
                icon={
                  <span className="relative">
                    <Bell className="h-4 w-4" />
                    {prefs.reminders ? <Check className="absolute -right-1 -bottom-1 h-2.5 w-2.5" /> : null}
                  </span>
                }
              />
            </div>
            {permission !== 'granted' ? (
              <button
                type="button"
                onClick={() => void askPermission()}
                className="mt-2 w-full rounded-xl border border-gold-400/35 bg-gold-400/[0.08] px-4 py-2.5 text-xs font-bold text-gold-800 transition hover:bg-gold-400/[0.16]"
              >
                امنح صلاحية الإشعارات
              </button>
            ) : null}

            {/* التهيئة */}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  wipePortalPrefs();
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-ember-500/20 bg-ember-500/[0.04] p-3.5 text-right transition hover:border-ember-500/35 hover:bg-ember-500/[0.07]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ember-500/25 bg-ember-500/[0.08] text-ember-600">
                  <UserCog className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink-900">مسح كل تفضيلات البوابة</span>
                  <span className="block text-[11px] text-ink-400">الثيم والخط والترتيب والمخطط — من البداية</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalPrefs({ onboarded: false });
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-brand-900/10 bg-white/65 p-3.5 text-right transition hover:border-brand-500/25"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-700">
                  <UserCog className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink-900">معالج التهيئة من جديد</span>
                  <span className="block text-[11px] text-ink-400">المستوى والجروب والتخصص</span>
                </span>
              </button>
              <div className="flex items-start gap-2.5 rounded-2xl border border-brand-900/10 bg-brand-500/[0.05] p-3.5">
                <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
                <div className="text-[11px] leading-relaxed text-ink-500">
                  <p className="font-bold text-ink-800">اختصارات سريعة</p>
                  <p>Ctrl+K لوحة الأوامر · Esc إغلاق · ↑↓ تنقل</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
