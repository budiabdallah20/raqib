'use client';

/**
 * 🚀 الفاصلة العائمة — كل ميزات البوابة بضغطة واحدة من أي مكان
 * (سكان الكود، لوحة الأوامر، المذكرة، الملفات، المحاضرات، الإعدادات، الوضع الليلي).
 */
import * as React from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CloudUpload,
  Command,
  FolderOpen,
  Moon,
  NotebookPen,
  ScanLine,
  Settings2,
  Sun,
  Command as CommandIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SCAN_EVENT,
  openPalette,
  openSettings,
} from '@/lib/commands';
import { getPortalPrefs, setPortalPrefs, usePortalPrefs } from '@/lib/portal-prefs';
import { toast } from './PortalAgent';

type Item =
  | { kind: 'action'; icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }
  | { kind: 'link'; icon: React.ReactNode; label: string; href: string }
  | { kind: 'divider'; label: string };

export function QuickDock() {
  const prefs = usePortalPrefs();
  const [open, setOpen] = React.useState(false);
  const [queueBadge, setQueueBadge] = React.useState(0);

  // عداد طابور الحضور المعلق (يتحدث لو حصلت مزامنة)
  React.useEffect(() => {
    setQueueBadge(prefs.offlineQueue.length);
    const sync = () => setQueueBadge(getPortalPrefs().offlineQueue.length);
    window.addEventListener('raqib:queue:synced', sync);
    return () => window.removeEventListener('raqib:queue:synced', sync);
  }, [prefs.offlineQueue]);

  const items: Item[] = React.useMemo(
    () => [
      {
        kind: 'action',
        icon: <ScanLine className="h-4.5 w-4.5" />,
        label: 'امسح كود الحضور',
        onClick: () => window.dispatchEvent(new CustomEvent(SCAN_EVENT)),
      },
      {
        kind: 'action',
        icon: <Command className="h-4.5 w-4.5" />,
        label: 'لوحة الأوامر — Ctrl+K',
        onClick: openPalette,
      },
      {
        kind: 'action',
        icon: <Settings2 className="h-4.5 w-4.5" />,
        label: 'أدوات العرض والإتاحة',
        onClick: openSettings,
      },
      {
        kind: 'action',
        icon: prefs.theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />,
        label: prefs.theme === 'dark' ? 'الدنيا ظاهرة — رجّع النور' : 'الوضع الليلي للبوابة',
        onClick: () => setPortalPrefs({ theme: getPortalPrefs().theme === 'dark' ? 'light' : 'dark' }),
      },
      { kind: 'divider', label: 'أقسامك' },
      { kind: 'link', icon: <NotebookPen className="h-4.5 w-4.5" />, label: 'مذكرة الملاحظات', href: '/student/notes' },
      { kind: 'link', icon: <FolderOpen className="h-4.5 w-4.5" />, label: 'ملفات المقررات', href: '/student/materials' },
      { kind: 'link', icon: <CalendarClock className="h-4.5 w-4.5" />, label: 'سجل المحاضرات', href: '/student/lectures' },
      {
        kind: 'action',
        icon: <CloudUpload className="h-4.5 w-4.5" />,
        label: queueBadge ? `${queueBadge} كود حضور معلّق — راجع الآن` : 'كود الحضور المعلّق',
        onClick: () => {
          void syncQueue();
        },
      },
    ],
    [prefs.theme, queueBadge],
  );

  return (
    <>
      {open ? (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-[58] hidden cursor-default sm:block"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
          }}
        />
      ) : null}
      <div className="fixed bottom-5 left-5 z-[60] flex flex-col items-start gap-2" dir="rtl">
        <AnimatePresence>
          {open
            ? items.map((item, index) => (
                <motion.div
                  key={item.kind === 'divider' ? `d-${item.label}` : item.label}
                  initial={{ opacity: 0, x: -14, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.9 }}
                  transition={{ duration: 0.16, delay: index * 0.024, ease: [0.22, 1, 0.36, 1] }}
                >
                  {item.kind === 'divider' ? (
                    <p className="px-2 pt-1 text-[9px] font-bold text-ink-300">{item.label}</p>
                  ) : item.kind === 'link' ? (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      title={item.label}
                      className="group flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/85 py-2.5 pl-3 pr-4 shadow-glass backdrop-blur-xl transition hover:border-gold-400/40 hover:bg-gold-400/[0.08]"
                    >
                      <span className="text-ink-500 transition group-hover:text-gold-700">{item.icon}</span>
                      <span className="whitespace-nowrap text-xs font-bold text-ink-800">{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        item.onClick();
                        setOpen(false);
                      }}
                      title={item.label}
                      className={`group relative flex items-center gap-2.5 rounded-2xl border py-2.5 pl-3 pr-4 shadow-glass backdrop-blur-xl transition ${
                        queueBadge && item.label.includes('معلّق')
                          ? 'border-amber-500/40 bg-amber-500/[0.10]'
                          : 'border-white/80 bg-white/85 hover:border-gold-400/40 hover:bg-gold-400/[0.08]'
                      }`}
                    >
                      <span className={`transition ${queueBadge && item.label.includes('معلّق') ? 'text-amber-700' : 'text-ink-500 group-hover:text-gold-700'}`}>
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap text-xs font-bold text-ink-800">{item.label}</span>
                      {queueBadge > 0 && item.label.includes('معلّق') ? (
                        <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ember-500 text-[9px] font-bold text-white">
                          {queueBadge}
                        </span>
                      ) : null}
                    </button>
                  )}
                </motion.div>
              ))
            : null}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'إغلاق أدوات البوابة' : 'فتح أدوات البوابة'}
          aria-expanded={open}
          initial={false}
          whileTap={{ scale: 0.92 }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2c8f84,#155f57)] text-white shadow-[0_18px_44px_-12px_rgba(44,143,132,.6)] transition-transform ${
            open ? 'rotate-45' : 'rotate-0 hover:-translate-y-1'
          }`}
        >
          <CommandIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-gold-500" />
        </motion.button>
      </div>
    </>
  );
}

/** تشغيل المزامنة يدويًا — نبضة فورية للوكيل */
function syncQueue() {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) {
    toast('لسه مفيش نت — هيتزامن أول ما النت يرجع');
    return;
  }
  import('./PortalAgent').then(({ runPortalTick }) => runPortalTick());
}
