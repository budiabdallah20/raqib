'use client';

/**
 * ⌘ لوحة الأوامر الموحّدة — تعمل لكل الأدوار (طالب / دكتور / أدمن)
 * Ctrl + K من أي صفحة في أي بوابة: تنقّل فوري + إجراءات سريعة + أوامر الصفحة.
 * الطالب يأخذ أوامره (مسح QR / ثيم / أدوات العرض)، والدكتور والأدمن يأخذان أوامرهم.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Command as CommandIcon,
  FolderOpen,
  Gauge,
  ListChecks,
  Moon,
  NotebookPen,
  ScanLine,
  Settings2,
  ShieldCheck,
  Users,
  UsersRound,
  UserSquare2,
  BookOpen,
  BarChart3,
  QrCode,
  BookOpenCheck,
  FileBarChart,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PALETTE_EVENT,
  SCAN_EVENT,
  SETTINGS_EVENT,
  normalizeArabic,
  useCommands,
  type Command,
} from '@/lib/commands';
import { getPortalPrefs, setPortalPrefs } from '@/lib/portal-prefs';
import type { Role } from '@/types';

const GROUP_ORDER = ['التنقل', 'إجراءات', 'أوامر الصفحة'];

const STUDENT_NAV: Command[] = [
  { id: 'nav:student', group: 'التنقل', label: 'لوحة الطالب — الرئيسية', keywords: 'home dashboard حدال', href: '/student' },
  { id: 'nav:student-exams', group: 'التنقل', label: 'امتحاناتي', hint: 'MCQ · صح/خطأ · مقالي — تصحيح حتمي', keywords: 'امتحان اختبار كويز quiz exam امتحاناتي', href: '/student/exams' },
  { id: 'nav:student-registration', group: 'التنقل', label: 'التسجيل والساعات', hint: 'حد 17 ساعة + تعارض المواعيد', keywords: 'تسجيل ساعات معتمدة register credit enroll drop سحب 17', href: '/student/registration' },
  { id: 'nav:student-compass', group: 'التنقل', label: 'بوصلة المقررات — وضعك في كل مادة', hint: 'حضور + درجات + إنذار مبكر', keywords: 'بوصلة compass خطر انذار مادة مقررات', href: '/student/compass' },
  { id: 'nav:student-schedule', group: 'التنقل', label: 'الجدول الأسبوعي', keywords: 'جدول محاضرات حصص', href: '/student/schedule' },
  { id: 'nav:student-tasks', group: 'التنقل', label: 'المهام والتسليمات', keywords: 'تاسك مهام تكليف', href: '/student/tasks' },
  { id: 'nav:student-notes', group: 'التنقل', label: 'مذكرة الملاحظات', keywords: 'ملاحظات ذاكرها', href: '/student/notes' },
  { id: 'nav:student-materials', group: 'التنقل', label: 'ملفات المقررات', keywords: 'ملفات pdf مذكرة', href: '/student/materials' },
  { id: 'nav:student-lectures', group: 'التنقل', label: 'سجل المحاضرات وحضورك', keywords: 'محاضرات مسح', href: '/student/lectures' },
  { id: 'nav:student-report', group: 'التنقل', label: 'تقرير الأداء الذاتي', keywords: 'تقرير تصدير excel', href: '/student/report' },
  { id: 'nav:student-profile', group: 'التنقل', label: 'حسابي والإعدادات الشخصية', keywords: 'حساب باسورد مفتاح', href: '/student/profile' },
];

const STUDENT_ACTIONS: Command[] = [
  { id: 'act:scan', group: 'إجراءات', label: 'امسح كود الحضور', hint: 'كاميرا أو رمز يدوي', keywords: 'qr حضر حضور scan', run: () => window.dispatchEvent(new CustomEvent(SCAN_EVENT)) },
  { id: 'act:theme', group: 'إجراءات', label: 'تبديل الوضع الليلي / النهاري', hint: 'ثيم البوابة', keywords: 'dark darkmode theme ثيم ليل', run: () => setPortalPrefs({ theme: getPortalPrefs().theme === 'dark' ? 'light' : 'dark' }) },
  { id: 'act:settings', group: 'إجراءات', label: 'أدوات العرض والإتاحة', hint: 'حجم الخط · التباين · تنبيهات', keywords: 'settings خط تباين عرض', run: () => window.dispatchEvent(new CustomEvent(SETTINGS_EVENT)) },
  { id: 'act:top', group: 'إجراءات', label: 'ارفع لأول الصفحة', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
];

const PROFESSOR_NAV: Command[] = [
  { id: 'nav:prof', group: 'التنقل', label: 'لوحة الدكتور — الرئيسية', keywords: 'home dashboard حدال', href: '/professor' },
  { id: 'nav:prof-schedule', group: 'التنقل', label: 'جدولي', keywords: 'جدول حصص محاضرات', href: '/professor/schedule' },
  { id: 'nav:prof-board', group: 'التنقل', label: 'لوحة QR للعرض', hint: 'شاشة البروجكتور', keywords: 'qr لوحة عرض بروكتور حضور', href: '/professor/board' },
  { id: 'nav:prof-grades', group: 'التنقل', label: 'الدرجات — إدخال ومتابعة', keywords: 'درجات كويز ميدترم أعمال رصد', href: '/professor/grades' },
  { id: 'nav:prof-exams', group: 'التنقل', label: 'الامتحانات الإلكترونية', hint: 'Exam Studio — أنشئ وانشر وصحح', keywords: 'امتحان كويز exam studio نشر نتائج تصحيح', href: '/professor/exams' },
  { id: 'nav:prof-at-risk', group: 'التنقل', label: 'لوحة المخاطر المبكرة', hint: 'الطلاب المعرضون للتعثر قبل الامتحان', keywords: 'خطر مخاطر تعثر انذار watchlist متابعة', href: '/professor/at-risk' },
  { id: 'nav:prof-tasks', group: 'التنقل', label: 'المهام والتسليمات', keywords: 'تاسك مهام تقييم تصحيح', href: '/professor/tasks' },
  { id: 'nav:prof-resources', group: 'التنقل', label: 'الملفات والمراجع', keywords: 'ملفات pdf مراجع رفع', href: '/professor/resources' },
  { id: 'nav:prof-reports', group: 'التنقل', label: 'التقارير', hint: 'حضور الطلاب والتقارير', keywords: 'تقرير excel pdf', href: '/professor/reports' },
];

const PROFESSOR_ACTIONS: Command[] = [
  { id: 'act:top', group: 'إجراءات', label: 'ارفع لأول الصفحة', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
];

const ADMIN_NAV: Command[] = [
  { id: 'nav:admin', group: 'التنقل', label: 'غرفة القيادة — الرئيسية', keywords: 'home dashboard حدال', href: '/admin' },
  { id: 'nav:admin-pulse', group: 'التنقل', label: 'نبض المنصة — غرفة العمليات', hint: 'مؤشرات حية + شذوذ تلقائي', keywords: 'pulse نبض عمليات غرفة عمليات live anomaly صحة', href: '/admin/pulse' },
  { id: 'nav:admin-schedule', group: 'التنقل', label: 'الجداول — سحب وإفلات', keywords: 'جدول مواعيد slots drag', href: '/admin/schedule' },
  { id: 'nav:admin-students', group: 'التنقل', label: 'الطلاب', keywords: 'طلاب طالب حسابات', href: '/admin/students' },
  { id: 'nav:admin-professors', group: 'التنقل', label: 'الدكاترة', keywords: 'دكاترة اساتذة', href: '/admin/professors' },
  { id: 'nav:admin-courses', group: 'التنقل', label: 'المقررات', keywords: 'مواد مقررات كورسات', href: '/admin/courses' },
  { id: 'nav:admin-reports', group: 'التنقل', label: 'التقارير', keywords: 'تقرير export csv', href: '/admin/reports' },
  { id: 'nav:admin-audit', group: 'التنقل', label: 'سجل التدقيق', keywords: 'audit تدقيق سجلات', href: '/admin/audit' },
  { id: 'nav:admin-settings', group: 'التنقل', label: 'الإعدادات', keywords: 'اعدادات term تواريخ qr', href: '/admin/settings' },
];

const ADMIN_ACTIONS: Command[] = [
  { id: 'act:top', group: 'إجراءات', label: 'ارفع لأول الصفحة', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
];

const ROLE_CONFIG: Record<Role, { nav: Command[]; actions: Command[]; placeholder: string }> = {
  STUDENT: {
    nav: STUDENT_NAV,
    actions: STUDENT_ACTIONS,
    placeholder: 'ابحث: جدول، تاسك، ملاحظة، امسح الكود، الوضع الليلي…',
  },
  PROFESSOR: {
    nav: PROFESSOR_NAV,
    actions: PROFESSOR_ACTIONS,
    placeholder: 'ابحث: درجات، مخاطر، لوحة QR، تاسكات، تقارير…',
  },
  ADMIN: {
    nav: ADMIN_NAV,
    actions: ADMIN_ACTIONS,
    placeholder: 'ابحث: طلاب، مقررات، نبض المنصة، تدقيق، إعدادات…',
  },
};

const ROLE_ICON: Record<Role, Record<string, React.ReactNode>> = {
  STUDENT: {
    'nav:student': <Gauge className="h-4 w-4" />,
    'nav:student-compass': <ListChecks className="h-4 w-4" />,
    'nav:student-exams': <BookOpenCheck className="h-4 w-4" />,
    'nav:student-registration': <BookOpen className="h-4 w-4" />,
    'nav:student-schedule': <CalendarDays className="h-4 w-4" />,
    'nav:student-tasks': <NotebookPen className="h-4 w-4" />,
    'nav:student-notes': <NotebookPen className="h-4 w-4" />,
    'nav:student-materials': <FolderOpen className="h-4 w-4" />,
    'nav:student-lectures': <ScanLine className="h-4 w-4" />,
    'nav:student-report': <FileBarChart className="h-4 w-4" />,
    'nav:student-profile': <Settings2 className="h-4 w-4" />,
    'act:scan': <ScanLine className="h-4 w-4" />,
    'act:theme': <Moon className="h-4 w-4" />,
    'act:settings': <Settings2 className="h-4 w-4" />,
  },
  PROFESSOR: {
    'nav:prof': <Gauge className="h-4 w-4" />,
    'nav:prof-schedule': <CalendarDays className="h-4 w-4" />,
    'nav:prof-board': <QrCode className="h-4 w-4" />,
    'nav:prof-grades': <BarChart3 className="h-4 w-4" />,
    'nav:prof-exams': <BookOpenCheck className="h-4 w-4" />,
    'nav:prof-at-risk': <Activity className="h-4 w-4" />,
    'nav:prof-tasks': <ClipboardList className="h-4 w-4" />,
    'nav:prof-resources': <BookOpen className="h-4 w-4" />,
    'nav:prof-reports': <FileBarChart className="h-4 w-4" />,
  },
  ADMIN: {
    'nav:admin': <Gauge className="h-4 w-4" />,
    'nav:admin-pulse': <Activity className="h-4 w-4" />,
    'nav:admin-schedule': <CalendarDays className="h-4 w-4" />,
    'nav:admin-students': <Users className="h-4 w-4" />,
    'nav:admin-professors': <UserSquare2 className="h-4 w-4" />,
    'nav:admin-courses': <BookOpen className="h-4 w-4" />,
    'nav:admin-reports': <FileBarChart className="h-4 w-4" />,
    'nav:admin-audit': <ShieldCheck className="h-4 w-4" />,
    'nav:admin-settings': <Settings2 className="h-4 w-4" />,
  },
};

const FALLBACK_ICON = <CommandIcon className="h-4 w-4" />;

export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const registered = useCommands();
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.STUDENT;

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
    const pool = [...config.nav, ...config.actions, ...registered];
    const needle = normalizeArabic(query);
    if (!needle) return pool.slice(0, 40);
    return pool
      .filter((command) =>
        normalizeArabic(
          `${command.label} ${command.group} ${command.keywords ?? ''} ${command.hint ?? ''}`,
        ).includes(needle),
      )
      .slice(0, 40);
  }, [query, registered, config]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

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

  const iconFor = (command: Command) => ROLE_ICON[role]?.[command.id] ?? FALLBACK_ICON;

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
                placeholder={config.placeholder}
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
                            {iconFor(item)}
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
                <UsersRound className="h-3 w-3" /> RAQiB Command
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
