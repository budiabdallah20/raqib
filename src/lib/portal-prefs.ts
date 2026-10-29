'use client';

/**
 * 🧭 مخزن تفضيلات البوابة — حالة الطالب الشخصية على الجهاز (localStorage)
 * كل شيء هنا محلي 100% ولا يلمس قاعدة البيانات: الثيم، حجم الخط، التباين،
 * ترتيب أدوات اللوحة، المخطط الأسبوعي، البومودورو، طابور الحضور Offline، التهيئة.
 */
import * as React from 'react';

const KEY = 'raqib_portal_prefs_v1';

export type PortalTheme = 'light' | 'dark';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

export type PomodoroSession = { at: string; minutes: number; course: string };
export type OfflineScan = { token: string; at: string; tries: number };

export type PortalPrefs = {
  /** تهيئة أول استخدام (المستوى/الجروب/التخصص) */
  onboarded: boolean;
  level: string;
  group: string;
  major: string;
  theme: PortalTheme;
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
  /** تنبيه ١٠ دقائق قبل المحاضرة القادمة */
  reminders: boolean;
  /** ترتيب أدوات اللوحة + المخفية */
  widgetOrder: string[];
  hiddenWidgets: string[];
  /** مخطط الراجعة الأسبوعي */
  plannerWeek: string;
  plannerDone: Record<string, boolean>;
  plannerStreak: number;
  plannerStreakWeek: string;
  /** البومودورو */
  pomodoroDay: string;
  pomodoroSessions: PomodoroSession[];
  /** طابور مسح الحضور دون اتصال */
  offlineQueue: OfflineScan[];
};

export const WIDGET_DEFAULT_ORDER = [
  'focus',
  'health',
  'radar',
  'upcoming',
  'today',
  'tiles',
  'analytics',
  'whatif',
  'curve',
  'planner',
  'pomodoro',
  'grades',
  'notices',
] as const;

export const WIDGET_TITLES: Record<string, string> = {
  focus: 'شريط التركيز الذكي',
  health: 'مؤشر الصحة الأكاديمية',
  radar: 'رادار الحرمان',
  upcoming: 'المحاضرة القادمة',
  today: 'محاضرات النهاردة',
  tiles: 'الوصول السريع',
  analytics: 'تحليلات المواد',
  whatif: 'حاسبة المعدل التنبؤية',
  curve: 'منحنى معدلك',
  planner: 'مخطط الراجعة',
  pomodoro: 'تركيز البومودورو',
  grades: 'آخر الدرجات',
  notices: 'لائحة الإعلانات',
};

const STREAK_WEEKS = 2;

const DEFAULTS: PortalPrefs = {
  onboarded: false,
  level: '',
  group: '',
  major: '',
  theme: 'light',
  fontScale: 'md',
  highContrast: false,
  reduceMotion: false,
  reminders: false,
  widgetOrder: [...WIDGET_DEFAULT_ORDER],
  hiddenWidgets: [],
  plannerWeek: '',
  plannerDone: {},
  plannerStreak: 0,
  plannerStreakWeek: '',
  pomodoroDay: '',
  pomodoroSessions: [],
  offlineQueue: [],
};

/** حجم خط الجذر لكل درجة — % من 16px */
export const FONT_SCALE_PCT: Record<FontScale, string> = {
  sm: '92.5%',
  md: '100%',
  lg: '110%',
  xl: '121%',
};

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  sm: 'صغير',
  md: 'عادي',
  lg: 'كبير',
  xl: 'أكبر',
};

let state: PortalPrefs = { ...DEFAULTS };
let loaded = false;
const listeners = new Set<() => void>();

function read(): PortalPrefs {
  if (typeof window === 'undefined') return DEFAULTS;
  if (loaded) return state;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PortalPrefs>;
      state = {
        ...DEFAULTS,
        ...parsed,
        widgetOrder: sanitizeOrder(parsed.widgetOrder),
        plannerDone: parsed.plannerDone && typeof parsed.plannerDone === 'object' ? parsed.plannerDone : {},
        pomodoroSessions: Array.isArray(parsed.pomodoroSessions) ? parsed.pomodoroSessions.filter(isSession) : [],
        offlineQueue: Array.isArray(parsed.offlineQueue) ? parsed.offlineQueue.filter(isScan) : [],
      };
    }
  } catch {
    /* ملف تالف — نبدأ من الافتراضي */
  }
  return state;
}

function sanitizeOrder(order: unknown): string[] {
  if (!Array.isArray(order)) return [...WIDGET_DEFAULT_ORDER];
  const known = new Set<string>(WIDGET_DEFAULT_ORDER);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of order) {
    if (typeof id === 'string' && known.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of WIDGET_DEFAULT_ORDER) if (!seen.has(id)) out.push(id);
  return out;
}

function isSession(value: unknown): value is PomodoroSession {
  return Boolean(value) && typeof value === 'object' && 'at' in (value as object) && 'minutes' in (value as object);
}

function isScan(value: unknown): value is OfflineScan {
  return Boolean(value) && typeof value === 'object' && 'token' in (value as object);
}

function persist(next: PortalPrefs) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* مساحة ممتلئة أو وضع خصوصي — نكمل في الذاكرة */
  }
  listeners.forEach((listener) => listener());
}

export function getPortalPrefs(): PortalPrefs {
  return read();
}

export function setPortalPrefs(patch: Partial<PortalPrefs>) {
  persist({ ...read(), ...patch });
}

export function resetPortalPrefs() {
  persist({ ...DEFAULTS, onboarded: true, theme: read().theme, fontScale: read().fontScale });
}

export function resetWidgets() {
  setPortalPrefs({ widgetOrder: [...WIDGET_DEFAULT_ORDER], hiddenWidgets: [] });
}

export function moveWidget(id: string, dir: -1 | 1) {
  const prefs = read();
  const order = [...prefs.widgetOrder];
  const index = order.indexOf(id);
  if (index === -1) return;
  const target = index + dir;
  if (target < 0 || target >= order.length) return;
  order[index] = order[target]!;
  order[target] = id;
  setPortalPrefs({ widgetOrder: order });
}

export function toggleWidget(id: string) {
  const prefs = read();
  const hidden = prefs.hiddenWidgets.includes(id)
    ? prefs.hiddenWidgets.filter((value) => value !== id)
    : [...prefs.hiddenWidgets, id];
  if (hidden.length >= WIDGET_DEFAULT_ORDER.length) return; // لا نخفي اللوحة كلها
  setPortalPrefs({ hiddenWidgets: hidden });
}

/* ── المخطط الأسبوعي ── */

export function togglePlannerItem(key: string) {
  const prefs = read();
  const done = { ...prefs.plannerDone, [key]: !prefs.plannerDone[key] };
  setPortalPrefs({ plannerDone: done });
}

export function plannerProgress(week: string, keys: string[]): number {
  if (!keys.length) return 0;
  const prefs = read();
  const done = keys.filter((key) => prefs.plannerDone[`${week}:${key}`]).length;
  return Math.round((done / keys.length) * 100);
}

/** يرقّي التتابع الأسبوعي — يُستدعى عند وصول نسبة الأسبوع 60%+ */
export function bumpPlannerStreak(week: string, pct: number) {
  const prefs = read();
  if (pct < 60) return;
  if (prefs.plannerStreakWeek === week) return;
  const previous = prefs.plannerStreakWeek;
  const nextStreak =
    previous && previous < week && week === nextWeekKey(previous) ? prefs.plannerStreak + 1 : 1;
  setPortalPrefs({ plannerStreak: nextStreak, plannerStreakWeek: week });
}

function nextWeekKey(previous: string): string {
  const [year, week] = previous.split('-').map(Number);
  if (!year || !week) return previous;
  const next = new Date(year, 0, 1 + (week - 1) * 7 + 7);
  return `${next.getFullYear()}-W${getISOWeek(next)}`;
}

export function weekKey(date = new Date()): string {
  return `${date.getFullYear()}-W${getISOWeek(date)}`;
}

function getISOWeek(date: Date): number {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  target.setDate(target.getDate() - ((target.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

/* مقارنة مفاتيح أسبوع: أقل/تساوي/أكبر سلسلة — صيغة WNN ثابتة العرض */
export function compareWeekKeys(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

/* ── البومودورو ── */

export function addPomodoroSession(minutes: number, course: string) {
  const prefs = read();
  const today = new Date().toISOString().slice(0, 10);
  const sessions = prefs.pomodoroDay === today
    ? [...prefs.pomodoroSessions, { at: new Date().toISOString(), minutes, course }]
    : [{ at: new Date().toISOString(), minutes, course }];
  setPortalPrefs({ pomodoroDay: today, pomodoroSessions: sessions.slice(-60) });
}

export function pomodoroToday(): PomodoroSession[] {
  const prefs = read();
  const today = new Date().toISOString().slice(0, 10);
  return prefs.pomodoroDay === today ? prefs.pomodoroSessions : [];
}

/* ── طابور الحضور Offline ── */

export function queueOfflineScan(token: string) {
  const prefs = read();
  if (prefs.offlineQueue.some((scan) => scan.token === token)) return;
  setPortalPrefs({
    offlineQueue: [...prefs.offlineQueue, { token, at: new Date().toISOString(), tries: 0 }].slice(-10),
  });
}

export function takeOfflineScan(): OfflineScan | null {
  const prefs = read();
  const [first, ...rest] = prefs.offlineQueue;
  if (!first) return null;
  setPortalPrefs({ offlineQueue: rest });
  return first;
}

export function refundOfflineScan(scan: OfflineScan, fatal: boolean) {
  if (fatal || scan.tries >= STREAK_WEEKS) return; // رمز فاسد أو تعدّى المحاولات — نسقوطه
  const prefs = read();
  setPortalPrefs({ offlineQueue: [...prefs.offlineQueue, { ...scan, tries: scan.tries + 1 }] });
}

/* ── هوك React ── */

export function usePortalPrefs(): PortalPrefs {
  return React.useSyncExternalStore(subscribe, () => read(), () => DEFAULTS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
