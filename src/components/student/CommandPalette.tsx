'use client';

/**
 * ⌘ لوحة الأوامر الشاملة — Ctrl + K من أي صفحة طالب:
 * تنقّل فوري بين الأقسام + إجراءات سريعة + نتائج مرتبة من كل صفحة يفتحها.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Command as CommandIcon,
  FolderOpen,
  Gauge,
  Moon,
  NotebookPen,
  ScanLine,
  Settings2,
  MoonStar,
  Moon as MoonIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PALETTE_EVENT,
  SCAN_EVENT,
  SETTINGS_EVENT,
  allCommands,
  normalizeArabic,
  useCommands,
  type Command,
} from '@/lib/commands';
import { getPortalPrefs, setPortalPrefs } from '@/lib/portal-prefs';

const GROUP_ORDER = ['التنقل', 'إجراءات', 'أوامر الصفحة'];

const BUILTIN_ACTIONS: Command[] = [
  { id: 'cmp:scan', group: 'إجراءات', label: 'امسح كود الحضور', hint: 'كاميرا أو رمز يدوي', keywords: 'qr حضر حضور scan', run: () => window.dispatchEvent(new CustomEvent(SCAN_EVENT)) },
  { id: 'cmp:theme', group: 'إجراءات', label: 'تبديل الوضع الليلي / النهاري', hint: 'ثيم البوابة', keywords: 'dark darkmode theme ثيم ليل', run: () => setPortalPrefs({ theme: getPortalPrefs().theme === 'dark' ? 'light' : 'dark' }) },
  { id: 'cmp:settings', group: 'إجراءات', label: 'أدوات العرض والإتاحة', hint: 'حجم الخط · التباين · تنبيهات', keywords: 'settings خط تباين عرض', run: () => window.dispatchEvent(new CustomEvent(SETTINGS_EVENT)) },
  { id: 'cmp:top', group: 'إجراءات', label: 'ارفع لأول الصفحة', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
];

const BUILTIN_NAV: Command[] = [
  { id: 'cmp:home', group: 'التنقل', label: 'لوحة الطالب — الرئيسية', keywords: 'home dashboard حدال', href: '/student' },
  { id: 'cmp:schedule', group: 'التنقل', label: 'الجدول الأسبوعي', keywords: 'جدول محاضرات حصص', href: '/student/schedule' },
  { id: 'cmp:tasks', group: 'التنقل', label: 'المهام والتسليمات', keywords: 'تاسك مهام تكليف', href: '/student/tasks' },
  { id: 'cmp:notes', group: 'التنقل', label: 'مذكرة الملاحظات', keywords: 'ملاحظات ذاكرها', href: '/student/notes' },
  { id: 'cmp:materials', group: 'التنقل', label: 'ملفات المقررات', keywords: 'ملفات pdf مذكرة', href: '/student/materials' },
  { id: 'cmp:lectures', group: 'التنقل', label: 'سجل المحاضرات وحضورك', keywords: 'محاضرات مسح', href: '/student/lectures' },
  { id: 'cmp:report', group: 'التنقل', label: 'تقرير الأداء الذاتي', keywords: 'تقرير تصدير excel', href: '/student/report' },
  { id: 'cmp:profile', group: 'التنقل', label: 'حسابي والإعدادات الشخصية', keywords: 'حساب باسورد مفتاح', href: '/student/profile' },
];

function cmdIcon(command: Command) {
  if (command.run && command.href) return <NotebookPen className="h-4 w-4" />;
  switch (true) {
    case command.label.includes('امسح'):
      return <ScanLine className="h-4 w-4" />;
    case command.label.includes('ليلي'):
      return <MoonIcon className="h-4 w-4" />;
    case command.label.includes('أدوات'):
      return <Settings2 className="h-4 w-4" />;
    case command.label.includes('جدول'):
      return <CalendarDays className="h-4 w-4" />;
    case command.label.includes('ملاحظات') || command.label.includes('مذكرة'):
      return <NotebookPen className="h-4 w-4" />;
    case command.label.includes('ملفات'):
      return <FolderOpen className="h-4 w-4" />;
    case command.label.includes('تقرير'):
      return <Gauge className="h-4 w-4" />;
    case command.label.includes('ليلي'):
      return <MoonStar className="h-4 w-4" />;
    case command.label.includes('لوحة الأوامر'):
      return <CommandIcon className="h-4 w-4" />;
    default:
      return <CommandIcon className="h-4 w-4" />;
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const registered = useCommands();

  React.useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape' && open) setOpen(false);
    };
    const onEvent = () => setOpen(true);
    window.addEventListener('keydown', toggle);
    window.addEventListener(PALETTE_EVENT, onEvent);
    return () => {
      window.removeEventListener('keydown', toggle);
      window.removeEventListener(PALETTE_EVENT, onEvent);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const results = React.useMemo(() => {
    const pool = [...BUILTIN_NAV, ...BUILTIN_ACTIONS, ...registered].map((command, index) => ({
      ...command,
      _i: index,
    }));
    const needle = normalizeArabic(query);
    if (!needle) return pool.slice(0, 40);
    return pool
      .filter((command) =>
        normalizeArabic(
          `${command.label} ${command.group} ${command.keywords ?? ''} ${command.hint ?? ''}`,
        ).includes(needle),
      )
      .slice(0, 40);
  }, [query, registered]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  // تجميع حسب مجموعة مع ترتيب معلوم
  const grouped = React.useMemo(() => {
    const buckets = new Map<string, typeof results>();
    for (const item of results) {
      const bucket = buckets.get(item.group) ?? [];
      bucket.push(item);
      buckets.set(item.group, bucket);
    }
    const keys = [
      ...GROUP_ORDER.filter((key) => buckets.has(key)),
      ...Array.from(buckets.keys()).filter((key) => !GROUP_ORDER.includes(key)),
    ];
    return keys.map((key) => ({ group: key, items: buckets.get(key)! }));
  }, [results]);

  const flat = React.useMemo(() => grouped.flatMap((entry) => entry.items), [grouped]);

  const select = React.useCallback(
    (command?: { href?: string; run?: () => void }) => {
      setOpen(false);
      if (!command) return;
      if (command.run) command.run();
      else if (command.href) router.push(command.href);
    },
    [router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (value + 1) % Math.max(1, flat.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (value - 1 + flat.length) % Math.max(1, flat.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(flat[active]);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-950/35 p-4 pt-[12vh] backdrop-blur-[3px]"
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-gold-400/30 bg-white/92 shadow-[0_40px_120px_-30px_rgba(19,56,44,0.5)] backdrop-blur-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="لوحة الأوامر"
          >
            <div className="flex items-center gap-3 border-b border-brand-900/10 px-4 py-3">
              <CommandIcon className="h-4.5 w-4.5 shrink-0 text-gold-700" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ابحث: جدول، تاسك، ملاحظة، امسح الكود، الوضع الليلي…"
                className="w-full bg-transparent font-display text-sm font-bold text-ink-950 outline-none placeholder:text-ink-300"
                aria-label="بحث لوحة الأوامر"
              />
              <kbd className="hidden shrink-0 rounded-md border border-brand-900/15 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-ink-400 sm:block">
                Esc
              </kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2" dir="rtl">
              {flat.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-400">
                  مفيش نتيجة لـ «{query}» — جرب كلمة تانية
                </p>
              ) : (
                grouped.map((entry) => (
                  <div key={entry.group} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold text-ink-300">{entry.group}</p>
                    {entry.items.map((item) => {
                      const index = flat.indexOf(item);
                      const activeItem = index === active;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActive(index)}
                          onClick={() => select(item)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition ${
                            activeItem ? 'bg-brand-500/[0.10]' : ''
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                              activeItem
                                ? 'border-brand-500/30 bg-brand-500/[0.12] text-brand-700'
                                : 'border-brand-900/10 bg-white/70 text-ink-400'
                            }`}
                          >
                            {cmdIcon(item)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-ink-900">{item.label}</span>
                            {item.hint ? (
                              <span className="block truncate text-[11px] text-ink-400">{item.hint}</span>
                            ) : null}
                          </span>
                          {activeItem ? (
                            <kbd className="shrink-0 rounded-md border border-brand-900/15 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-ink-400">
                              ↵
                            </kbd>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-brand-900/10 bg-white/60 px-4 py-2 text-[10px] text-ink-400">
              <span>↑ ↓ للتنقل · Enter للفتح · Esc للإغلاق</span>
              <span className="flex items-center gap-1 font-bold text-gold-700">
                <Moon className="h-3 w-3" /> RAQiB Command
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
