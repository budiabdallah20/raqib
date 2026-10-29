'use client';

/**
 * 🛰 وكيل البوابة — يعمل خلف الكواليس في كل صفحات الطالب:
 * 1) تنبيه Web Notification قبل المحاضرة القادمة بعشر دقائق (بعد تفويض المستخدم).
 * 2) مزامنة طابور الحضور Offline تلقائيًا عند رجوع الاتصال (دورة كل 15 ثانية).
 * 3) توست خفيف عام (حدث `raqib:toast`) — من أي مكوّن عبر toast().
 */
import * as React from 'react';
import { CheckCircle2, CloudOff } from 'lucide-react';
import { celebrate } from '@/lib/celebrate';
import { getLiveReminder } from '@/lib/commands';
import {
  takeOfflineScan,
  refundOfflineScan,
  getPortalPrefs,
  usePortalPrefs,
  type PortalPrefs,
} from '@/lib/portal-prefs';
import { AnimatePresence, motion } from 'framer-motion';

const REMINDER_WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 3;

/** توست عام — أي مكوّن في البوابة يستطيع استدعاءها */
export function toast(text: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('raqib:toast', { detail: text }));
}

/** نبضة يدوية — تشغيل دورة التنبيه/المزامنة فورًا (يستخدمها QuickDock) */
export function runPortalTick() {
  const prefs = getPortalPrefs();
  tickReminder(prefs);
  void tickQueue(prefs);
}

export function PortalAgent() {
  const prefs = usePortalPrefs();
  const [message, setMessage] = React.useState<string | null>(null);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  React.useEffect(() => {
    let toastTimer = 0;
    const onToast = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      if (typeof text !== 'string') return;
      setMessage(text);
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setMessage(null), 4200);
    };
    window.addEventListener('raqib:toast', onToast);
    return () => {
      window.removeEventListener('raqib:toast', onToast);
      window.clearTimeout(toastTimer);
    };
  }, []);

  // نبض الوعي — كل 15 ثانية: تنبيه المحاضرة أو محاولة مزامنة
  React.useEffect(() => {
    const timer = window.setInterval(runPortalTick, 15_000);
    runPortalTick();
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {offline && prefs.offlineQueue.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 bottom-24 z-[55] mx-auto flex w-fit max-w-[92vw] items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/[0.12] px-4 py-2 text-xs font-bold text-gold-800 shadow-gold-soft backdrop-blur-md"
          role="status"
        >
          <CloudOff className="h-4 w-4" />
          لا يوجد اتصال — كود حضرك محفوظ محليًا وسيُرسل تلقائيًا عند الرجوع
        </motion.div>
      ) : null}
      <AnimatePresence>
        {message ? (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="fixed inset-x-0 bottom-24 z-[65] mx-auto flex w-fit max-w-[92vw] items-center gap-2 rounded-full border border-brand-500/30 bg-white/90 px-4 py-2.5 text-xs font-bold text-brand-700 shadow-glass backdrop-blur-xl"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ── تنبيه ١٠ دقائق ── */
function tickReminder(prefs: Pick<PortalPrefs, 'reminders'>) {
  if (!prefs.reminders) return;
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const live = getLiveReminder();
  if (!live) return;
  const target = new Date(live.nextAt);
  if (Number.isNaN(target.getTime())) return;
  const delta = target.getTime() - Date.now();
  if (delta <= 0 || delta > REMINDER_WINDOW_MS) return;

  const day = new Date().toISOString().slice(0, 10);
  const key = `raqib_reminded_${day}`;
  let fired: string[] = [];
  try {
    fired = (window.localStorage.getItem(key) || '').split(',').filter(Boolean);
  } catch {
    /* تجاهل */
  }
  if (fired.includes(live.nextAt)) return;

  try {
    new Notification('باقي ١٠ دقائق ويبدأ الجدول 🎯', {
      body: `${live.course ? `${live.course} — ` : ''}${live.title}${live.room ? ` · ${live.room}` : ''}`,
      tag: `raqib-lecture-${live.nextAt}`,
      icon: '/icon.svg',
    });
    window.localStorage.setItem(key, [...fired, live.nextAt].join(',').slice(-400));
  } catch {
    /* بعض المتصفحات ترفض بدون Service Worker — نتخطى بهدوء */
  }
}

/* ── مزامنة طابور Offline ── */
async function tickQueue(prefs: Pick<PortalPrefs, 'offlineQueue'>) {
  if (!prefs.offlineQueue.length) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const scan = takeOfflineScan();
  if (!scan) return;
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: scan.token }),
    });
    if (!res.ok) {
      // السيرفر رفض بشكل نهائي (رمز منتهي/مغلق/غير مسجل) — نسقوطه بلا محاولات أخرى
      reflectQueue();
      toast(`رمز حضور قديم اتشال من الطابور — السيرفر رفضه`);
      return;
    }
    reflectQueue();
    celebrate();
    toast('تم إرسال كود حضرك المعلّق ✅');
  } catch {
    // الشبكة تقطعت ثانيةً — نرجّعه للطابور، ولو تعدّى المحاولات نسقوطه
    refundOfflineScan(scan, false);
    if (scan.tries + 1 >= MAX_TRIES) reflectQueue();
  }
}

/** تحديث حالة الطابور في الواجهة — حدث عام يسمعه QuickDock */
function reflectQueue() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('raqib:queue:synced'));
}
