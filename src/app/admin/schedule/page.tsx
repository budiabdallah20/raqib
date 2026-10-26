'use client';

/**
 * ‌Builder الجداول — ميزة تحريك الكروت (Drag & Drop)
 * ─────────────────────────────────────────────────
 * • اسحب كارت من أي خانة وأفلته في خانة فاضية → يتقل من مكانه (move).
 * • اسحب كارت وأفلته على كارت تاني → الاثنين يتبدلوا (swap) فورًا + زر تراجع.
 * • اسحب مادة من "لوحة المواد" وأفلته في خانة فاضية → يتولد كارت جديد.
 * • كليك على كارت (بدون سحب) → يفتح تحريره (مادة/نوع/قاعة/VIP/حذف).
 * • كليك على كارت = تحديد، وبعدها كليك على خانة تانية = هناك ينتقل أو يتبدل
 *   (بديل السحب على الموبايل).
 * • زر تراجع يرجع آخر عملية (move/swap/create/delete/update) من غير ما يلمس
 *   السيرفر مرتين.
 * • كروت جروب A يقدر الأدمن يبدأ من نسخة قالب جروب B ثم يحرّك الكروت براحته.
 */

import * as React from 'react';
import {
  ArrowRightLeft,
  CalendarDays,
  Clock,
  Coffee,
  GripVertical,
  GraduationCap,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { SCHED_DAYS, SCHED_PERIODS, SCHED_KIND_LABEL } from '@/lib/constants';

type SlotCourse = {
  id: string;
  code: string;
  name: string;
  englishName?: string | null;
  professor: { name: string } | null;
};

type Slot = {
  id: string;
  day: number;
  period: number;
  kind: string;
  room?: string | null;
  isVip: boolean;
  course: SlotCourse;
};

type Course = {
  id: string;
  code: string;
  name: string;
  englishName?: string | null;
  professor: { name: string } | null;
};

type Inverse = { label: string; payload: Record<string, unknown> };

type Toast = { id: number; text: string; inverse?: Inverse; tone?: 'ok' | 'err' };

const cellKey = (day: number, period: number) => `d${day}p${period}`;
const parseKey = (key: string) => {
  const [, d, p] = key.match(/d(\d)p(\d)/) || [];
  return { day: Number(d), period: Number(p) };
};

const KIND_STYLE: Record<string, string> = {
  LECTURE: 'bg-gold-400/15 text-gold-700 border-gold-400/30',
  SECTION: 'bg-ivory/10 text-ivory border-ivory/20',
  LAB: 'bg-ember-500/15 text-ember-600 border-ember-400/30',
};

function toastTimer(id: number) {
  return setTimeout(() => setToastsSafe(id), 6500);
}

let toastsSetter: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;
function setToastsSafe(id: number) {
  toastsSetter?.((prev) => prev.filter((t) => t.id !== id));
}
function pushToast(
  setToastState: React.Dispatch<React.SetStateAction<Toast[]>>,
  toast: Omit<Toast, 'id'>,
): number {
  const id = Date.now() + Math.floor(Math.random() * 1e6);
  setToastState((prev) => [...prev.slice(-2), { ...toast, id }]);
  toastTimer(id);
  return id;
}

export default function ScheduleBuilderPage() {
  const [group, setGroup] = React.useState<'A' | 'B'>('B');
  const [grid, setGrid] = React.useState<Map<string, Slot>>(new Map());
  const [palette, setPalette] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [hoverKey, setHoverKey] = React.useState<string | null>(null);
  const [dragKey, setDragKey] = React.useState<string | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [selectedChip, setSelectedChip] = React.useState<string | null>(null);
  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [history, setHistory] = React.useState<Inverse[]>([]);

  toastsSetter = setToasts;

  const load = React.useCallback(async (g: 'A' | 'B') => {
    setLoading(true);
    try {
      const data = await api<{ group: string; slots: Slot[]; palette: Course[] }>(
        `/api/schedule?group=${g}`,
      );
      const map = new Map<string, Slot>();
      for (const slot of data.slots) map.set(cellKey(slot.day, slot.period), slot);
      setGrid(map);
      setPalette(data.palette || []);
      setHistory([]);
      setSelectedKey(null);
      setSelectedChip(null);
    } catch (error) {
      pushToast(setToasts, { text: (error as Error).message, tone: 'err' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(group);
  }, [group, load]);

  // ── القلب: تنفيذ عملية واحدة أمنيًا ( optimistic → server → rollback ) ──
  async function commit(
    payload: Record<string, unknown>,
    optimistic: () => Map<string, Slot>,
    rollback: (snapshot: Map<string, Slot>) => void,
    inverse?: Inverse,
    successText?: string,
  ) {
    const snapshot = new Map(grid);
    setBusy(true);
    setGrid(optimistic());
    try {
      await api('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ group, ...payload }),
      });
      if (inverse) setHistory((prev) => [...prev.slice(-11), inverse]);
      if (successText) {
        pushToast(setToasts, { text: successText, inverse });
      }
    } catch (error) {
      rollback(snapshot);
      pushToast(setToasts, { text: (error as Error).message, tone: 'err' });
    } finally {
      setBusy(false);
    }
  }

  async function undoLast(explicit?: Inverse) {
    const last = explicit ?? history[history.length - 1];
    if (!last) return;
    setBusy(true);
    try {
      await api('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ group, ...last.payload }),
      });
      setHistory((prev) => prev.filter((x) => x !== last));
      pushToast(setToasts, { text: `تم التراجع: ${last.label}` });
      await load(group);
    } catch (error) {
      pushToast(setToasts, { text: (error as Error).message, tone: 'err' });
    } finally {
      setBusy(false);
    }
  }

  function applyMove(from: string, to: string): Map<string, Slot> {
    const next = new Map(grid);
    const slot = next.get(from);
    if (!slot) return next;
    next.delete(from);
    next.delete(to);
    const { day, period } = parseKey(to);
    next.set(to, { ...slot, day, period });
    return next;
  }

  function applySwap(k1: string, k2: string): Map<string, Slot> {
    const next = new Map(grid);
    const a = next.get(k1);
    const b = next.get(k2);
    if (!a || !b) return next;
    const pa = parseKey(k1);
    const pb = parseKey(k2);
    next.delete(k1);
    next.delete(k2);
    next.set(k1, { ...b, day: pa.day, period: pa.period });
    next.set(k2, { ...a, day: pb.day, period: pb.period });
    return next;
  }

  function applyCreate(key: string, slot: Omit<Slot, 'day' | 'period'>): Map<string, Slot> {
    const next = new Map(grid);
    const { day, period } = parseKey(key);
    next.set(key, { ...slot, day, period });
    return next;
  }

  function applyDelete(key: string): Map<string, Slot> {
    const next = new Map(grid);
    next.delete(key);
    return next;
  }

  // ── عمليات السحب ──
  function handleDrop(targetKey: string, payload?: string) {
    const target = grid.get(targetKey);
    const isCellKey = /^d[2-5]p[1-4]$/.test(payload || '');
    const inner = payload && isCellKey && payload !== targetKey ? payload : null;
    const chipPayload = payload && !isCellKey ? payload : null;
    setHoverKey(null);
    setDragKey(null);

    if (inner) {
      const source = grid.get(inner);
      if (!source) return;
      // سحب كارت موجود → على فاضية: move | على مشغولة: swap
      if (!target) {
        const { day, period } = parseKey(targetKey);
        commit(
          { op: 'move', fromDay: source.day, fromPeriod: source.period, day, period },
          () => applyMove(inner, targetKey),
          (snap) => setGrid(snap),
          { label: 'نقل الكارت', payload: { op: 'move', fromDay: day, fromPeriod: period, day: source.day, period: source.period } },
          `نقل «${source.course.name}» إلى ${dayPeriodLabel(targetKey)}`,
        );
      } else {
        const a = parseKey(inner);
        const b = parseKey(targetKey);
        commit(
          { op: 'swap', a: { group, day: a.day, period: a.period }, b: { group, day: b.day, period: b.period } },
          () => applySwap(inner, targetKey),
          (snap) => setGrid(snap),
          { label: `تبديل «${source.course.name}» بـ «${target.course.name}»`, payload: { op: 'swap', a: { group, day: b.day, period: b.period }, b: { group, day: a.day, period: a.period } } },
          `تبديل «${source.course.name}» ↔ «${target.course.name}»`,
        );
      }
      return;
    }

    if (chipPayload || (selectedChip && !payload)) {
      // من لوحة المواد → خانة فاضية = create
      if (!target) {
        const course = palette.find((c) => c.id === (chipPayload || selectedChip));
        if (!course) return;
        const { day, period } = parseKey(targetKey);
        const optimisticSlot: Omit<Slot, 'day' | 'period'> = {
          id: `tmp-${targetKey}`,
          kind: 'LECTURE',
          room: null,
          isVip: false,
          course,
        };
        commit(
          { op: 'create', day, period, courseId: course.id, kind: 'LECTURE', room: '', isVip: false },
          () => applyCreate(targetKey, optimisticSlot),
          (snap) => setGrid(snap),
          { label: 'حذف الكارت', payload: { op: 'delete', day, period } },
          `أضيف «${course.name}» في ${dayPeriodLabel(targetKey)}`,
        );
        setSelectedChip(null);
      } else {
        pushToast(setToasts, { text: 'الخانة مشغولة — اسحب المادة لخانة فاضية عشان تضيفها', tone: 'err' });
      }
      return;
    }

    // كليك-المسار على كارت محدد (بديل السحب للمس)
    if (selectedKey && selectedKey !== targetKey) {
      const source = grid.get(selectedKey);
      if (!source) {
        setSelectedKey(null);
        return;
      }
      if (!target) {
        const { day, period } = parseKey(targetKey);
        commit(
          { op: 'move', fromDay: source.day, fromPeriod: source.period, day, period },
          () => applyMove(selectedKey, targetKey),
          (snap) => setGrid(snap),
          { label: 'نقل الكارت', payload: { op: 'move', fromDay: day, fromPeriod: period, day: source.day, period: source.period } },
          `نقل «${source.course.name}» إلى ${dayPeriodLabel(targetKey)}`,
        );
      } else {
        const a = parseKey(selectedKey);
        const b = parseKey(targetKey);
        commit(
          { op: 'swap', a: { group, day: a.day, period: a.period }, b: { group, day: b.day, period: b.period } },
          () => applySwap(selectedKey, targetKey),
          (snap) => setGrid(snap),
          { label: `تبديل «${source.course.name}» بـ «${target.course.name}»`, payload: { op: 'swap', a: { group, day: b.day, period: b.period }, b: { group, day: a.day, period: a.period } } },
          `تبديل «${source.course.name}» ↔ «${target.course.name}»`,
        );
      }
      setSelectedKey(null);
      return;
    }

    if (!inner && !chipPayload && !selectedKey && !selectedChip) {
      // كليك بدون تحديد — لا شيء
      return;
    }
  }

  // ── حذف عبر الـ modal ──
  async function handleDelete(key: string) {
    const slot = grid.get(key);
    if (!slot) return;
    const { day, period } = parseKey(key);
    setEditKey(null);
    commit(
      { op: 'delete', day, period },
      () => applyDelete(key),
      (snap) => setGrid(snap),
      {
        label: 'استرجاع الكارت',
        payload: {
          op: 'create',
          day,
          period,
          courseId: slot.course.id,
          kind: slot.kind,
          room: slot.room || '',
          isVip: slot.isVip,
        },
      },
      `اتحذف «${slot.course.name}» — في ${dayPeriodLabel(key)}`,
    );
  }

  // ── حفظ التعديلات من الـ modal ──
  async function handleUpdate(key: string, patch: { kind: string; room: string; isVip: boolean; courseId: string }) {
    const { day, period } = parseKey(key);
    const prev = grid.get(key);
    setEditKey(null);
    const inverse: Inverse = {
      label: 'استرجاع التعديل',
      payload: {
        op: 'update',
        day,
        period,
        ...(prev
          ? { courseId: prev.course.id, kind: prev.kind, room: prev.room || '', isVip: prev.isVip }
          : {}),
      },
    };
    commit(
      { op: 'update', day, period, ...patch },
      () => {
        const next = new Map(grid);
        const course = palette.find((c) => c.id === patch.courseId) || prev?.course;
        if (prev && course) {
          next.set(key, { ...prev, kind: patch.kind, room: patch.room || null, isVip: patch.isVip, course });
        }
        return next;
      },
      (snap) => setGrid(snap),
      inverse,
      'تم تحديث الكارت',
    );
  }

  async function copyFrom(source: 'A' | 'B') {
    setBusy(true);
    try {
      await api('/api/schedule', { method: 'POST', body: JSON.stringify({ op: 'copyFrom', group, source }) });
      pushToast(setToasts, { text: `نسخة قالب جروب ${source} اتحمّلت — حرّك الكروت براحتك دلوقتي` });
      await load(group);
    } catch (error) {
      pushToast(setToasts, { text: (error as Error).message, tone: 'err' });
    } finally {
      setBusy(false);
    }
  }

  // إحصاءات
  const slots = Array.from(grid.values());
  const usedCodes = new Set(slots.map((s) => s.course.code));
  const stats = {
    cards: slots.length,
    hours: slots.length * 2,
    sections: slots.filter((s) => s.kind === 'SECTION').length,
    labs: slots.filter((s) => s.kind === 'LAB').length,
    freeSlots: 16 - slots.length,
    courses: usedCodes.size,
  };
  // كروت نفس المادة المكررة في نفس اليوم → تنبيه غير مانع
  const dayCourseCount = new Map<string, number>();
  for (const s of slots) dayCourseCount.set(`${s.course.id}|d${s.day}`, (dayCourseCount.get(`${s.course.id}|d${s.day}`) || 0) + 1);
  const duplicatedCourses = Array.from(
    new Set(
      slots
        .filter((s) => (dayCourseCount.get(`${s.course.id}|d${s.day}`) || 0) > 1)
        .map((s) => s.course.code),
    ),
  );

  const editing = editKey ? grid.get(editKey) : null;
  const emptyHistory = history.length === 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* الترويسة */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-950">
              <CalendarDays className="ml-1 inline h-6 w-6 text-gold-700" />{' '}
              builder الجداول
            </h1>
            <p className="text-sm text-muted">
              سحب وإفلات كروت المحاضرات بين الخانات — التبديل والتأريخ والتقليد وتعديل المشي.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={group === 'B' ? 'default' : 'outline'} size="sm" onClick={() => setGroup('B')}>
              جروب B
            </Button>
            <Button variant={group === 'A' ? 'default' : 'outline'} size="sm" onClick={() => setGroup('A')}>
              جروب A
            </Button>
            <Button variant="outline" size="sm" disabled={emptyHistory || busy} onClick={() => undoLast()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              تراجع {emptyHistory ? '' : `(${history.length})`}
            </Button>
          </div>
        </div>

        {/* تنبيه + إرشاد */}
        <div className="rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] p-4 text-sm text-ivory">
          <p className="font-semibold text-gold-700">
            <Sparkles className="ml-1 inline h-4 w-4" /> إزاي تحرك كرت؟
          </p>
          <ul className="mt-1 list-inside list-disc text-muted">
            <li>
              اسحب الكرت وأفلته في خانة تانية؛ لو في ال <b>خانة فاضية</b> هنقل، ولو في <b>خانة مشغولة</b> هـ
              يتبدل فيًا الصنها بين بتتحرك – swap كامل.
            </li>
            <li>على الموبايل: كليك عشان محتاج مجموعة، وبعدين كليك على الخانة المراد قلبها/تبديلها.</li>
            <li>كل عملية فورًا هي عمرها للجميع (server authoritative) وع بتراجع كامل من زر "تراجع".</li>
          </ul>
        </div>

        {group === 'A' && slots.length === 0 && !loading && (
          <div className="rounded-2xl border border-ink-border bg-coal p-6 text-center">
            <p className="text-ink-950 font-semibold">جدول جروب A فاضي</p>
            <p className="text-sm text-muted mt-1">
              قم ببنائه بنفسك: انقل مواد من لوحة المواد أدناه لبلت أحد الخلايا؛ أو ابدأ بقالب جروب B ثم حرك الكروت.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => copyFrom('B')}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                تحميل قالب جروب B
              </Button>
            </div>
          </div>
        )}

        {group === 'B' && slots.length > 0 && (
          <div className="flex items-center justify-end text-xs">
            <span className="rounded-full border border-gold-400/20 bg-gold-400/[0.06] px-2 py-1 text-gold-700/70">
              {slots.length} كارت · مزروع من الجدول الرسمي بالـ PDF
            </span>
          </div>
        )}

        {/* الجريد */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted">
            <Loader2 className="ml-2 h-6 w-6 animate-spin" /> يتم تحميل الجدول…
          </div>
        ) : (
          <div className="space-y-2">
            {/* صف الأيام */}
            <div className="grid min-w-[640px] grid-cols-5 gap-2" dir="rtl">
              <div />
              {SCHED_DAYS.map((d) => (
                <div
                  key={d.day}
                  className="rounded-xl border border-gold-400/25 bg-coal px-2 py-2 text-center font-bold text-gold-700"
                >
                  {d.ar}
                </div>
              ))}
            </div>
            {/* صفوف الحصص */}
            {SCHED_PERIODS.map((p) => (
              <div key={p.period} className="grid min-w-[640px] grid-cols-5 gap-2" dir="rtl">
                <div className="rounded-xl border border-ink-border bg-ash px-2 py-2 text-center">
                  <p className="font-bold text-sm text-ink-950">الحصة {p.period}</p>
                  <p className="text-[9px] text-muted">{p.time}</p>
                </div>
                {SCHED_DAYS.map((d) => {
                  const key = cellKey(d.day, p.period);
                  const slot = grid.get(key);
                  const isHover = hoverKey === key;
                  const isSelected = selectedKey === key;
                  const dayDup = slot ? (dayCourseCount.get(`${slot.course.id}|d${d.day}`) || 0) > 1 : false;
                  return (
                    <div
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverKey(key);
                      }}
                      onDragLeave={() => setHoverKey((prev) => (prev === key ? null : prev))}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData('text/plain') || undefined;
                        handleDrop(key, data);
                      }}
                      onClick={() => handleDrop(key)}
                      className={`min-h-[96px] select-none rounded-xl p-1 transition-all ${
                        slot
                          ? 'cursor-pointer'
                          : 'cursor-cell border-2 border-dashed border-ink-border bg-coal/40'
                      } ${
                        isHover
                          ? 'border-gold-400 bg-gold-400/10 ring-2 ring-gold-400/60'
                          : selectedChip
                            ? 'border-name-100 bg-cream/[0.02]'
                            : ''
                      } ${!slot && selectedKey ? 'border-gold-400/70' : ''}`}
                    >
                      {slot ? (
                        <SlotCard
                          slot={slot}
                          selected={isSelected}
                          duplicate={dayDup}
                          onOpenEdit={() => {
                            setEditKey(key);
                            setSelectedKey(null);
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', key);
                            setDragKey(key);
                          }}
                          onSelect={() => setSelectedKey((prev) => (prev === key ? null : key))}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="flex flex-col items-center text-ink-700">
                            <Coffee className="h-4 w-4 opacity-60" />
                            <span className="mt-1 text-[10px]">فراغ</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {!group && (
          <div className="text-xs text-muted">اختر مجموعة أولً.</div>
        )}

        {/* إحصاءات الجريد — نفس روح ورقة الـ PDF */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="كروت" value={stats.cards} icon={<CalendarDays className="h-4 w-4" />} />
          <StatTile label="ساعات أسبوعية" value={stats.hours} icon={<Clock className="h-4 w-4" />} />
          <StatTile label="سكشنات" value={stats.sections} icon={<Users className="h-4 w-4" />} />
          <StatTile label="معامل" value={stats.labs} icon={<GripVertical className="h-4 w-4" />} />
          <StatTile label="مواد" value={stats.courses} icon={<GraduationCap className="h-4 w-4" />} />
          <StatTile label="خانات حرة" value={stats.freeSlots} icon={<Coffee className="h-4 w-4" />} />
        </div>

        {duplicatedCourses.length > 0 && (
          <div className="rounded-xl border border-ember-400/30 bg-ember-500/[0.08] p-3 text-sm text-ember-600">
            <b>تنبيه منطقي:</b> نفس المادة متكررة مرتين بنفس اليوم: {duplicatedCourses.join('، ')}. راجع الكروت (ممكن تبديل ممتاز).
          </div>
        )}

        {/* لوحة المواد */}
        <div className="rounded-2xl border border-ink-border bg-coal p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-ink-950">لوحة المواد</p>
            <p className="text-xs text-muted">
              اسحب مادة وقم بتركيبها في خانة فاضية، أو كليك على المادة ثم كليك على الخانة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {palette.map((course) => (
              <button
                key={course.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', course.id);
                  setSelectedChip(course.id);
                }}
                onClick={() => setSelectedChip((prev) => (prev === course.id ? null : course.id))}
                className={`cursor-grab rounded-xl border px-3 py-2 text-sm transition-all active:cursor-grabbing ${
                  selectedChip === course.id
                    ? 'border-gold-400 bg-gold-400/15 text-gold-700 ring-2 ring-gold-400/50'
                    : 'border-ink-border bg-ash text-ivory hover:border-gold-400/40'
                }`}
              >
                <span className="text-gold-700 text-[10px]">{course.code}</span>
                <span className="mx-1">{course.name}</span>
                {course.professor?.name && (
                  <span className="text-[10px] text-muted"> · {course.professor.name}</span>
                )}
              </button>
            ))}
            {selectedChip && (
              <Button variant="outline" size="sm" onClick={() => setSelectedChip(null)}>
                إلغاء التحديد
              </Button>
            )}
          </div>
        </div>

        {/* تحذير القالب من جروب آخر */}
        <div className="rounded-2xl border border-ink-border bg-coal p-4 text-sm text-muted">
          <p className="mb-2 text-ink-950 font-semibold font-16">بدء بنظام سريع</p>
          <div className="flex flex-wrap gap-2">
            {group === 'A' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => copyFrom('B')}>
                نسخ قالب جروب B إلى A
              </Button>
            )}
            {group === 'B' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => copyFrom('A')}>
                نسخ قالب جروب A إلى B
              </Button>
            )}
            <span className="self-center text-xs">
              يعكس الجريد الحالي مع نموذج مُفلتر من المجموعة الأخرى لتهيئة سريعة، بعدها حرّك بحرية كاملة.
            </span>
          </div>
        </div>

        {/* المودال */}
        {editing && editKey && (
          <EditModal
            key={editKey}
            slot={editing}
            palette={palette}
            busy={busy}
            onClose={() => setEditKey(null)}
            onDelete={() => handleDelete(editKey)}
            onSave={(patch) => handleUpdate(editKey, patch)}
          />
        )}

        {/* إشعارات */}
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-xl backdrop-blur ${
                t.tone === 'err'
                  ? 'border-ember-400/40 bg-[#1C0A0E]/95 text-ember-600'
                  : 'border-gold-400/40 bg-[#1C160A]/95 text-gold-800'
              }`}
            >
              <span>{t.text}</span>
              {t.inverse && (
                <Button variant="outline" size="sm" onClick={async () => {
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                  await undoLast(t.inverse);
                }}>
                  تراجع
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

// ── كارت الجريد ──
function SlotCard({
  slot,
  selected,
  duplicate,
  onOpenEdit,
  onDragStart,
  onSelect,
}: {
  slot: Slot;
  selected: boolean;
  duplicate?: boolean;
  onOpenEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onSelect: () => void;
}) {
  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        stop(e);
        onSelect();
      }}
      className={`h-full cursor-grab rounded-lg p-2 active:cursor-grabbing ${
        slot.isVip
          ? 'border border-gold-400/40 bg-gradient-to-br from-gold-500/15 to-white/60 shadow-[0_0_20px_-6px_rgba(255,215,0,0.45)]'
          : 'border border-ink-border bg-ash'
      } ${selected ? 'ring-2 ring-gold-400/80' : ''} transition-shadow hover:shadow-gold-soft`}
    >
      <div className="flex items-start justify-between gap-1" onClick={stop}>
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-md bg-gold-400/15 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">
            {slot.course.code}
          </span>
          <span className={`rounded-md border px-1.5 py-0.5 text-[9px] ${KIND_STYLE[slot.kind] || ''}`}>
            {SCHED_KIND_LABEL[slot.kind] || slot.kind}
          </span>
          {slot.isVip && <Star className="h-3 w-3 fill-gold-400 text-gold-700" />}
          {duplicate && (
            <span title="مكررة في نفس اليوم" className="rounded-md bg-ember-500/20 px-1 text-[9px] text-ember-600">
              !٢x
            </span>
          )}
        </div>
        <div className="flex items-center" onClick={stop}>
          <GripVertical className="h-3 w-3 text-muted/60" />
          <button
            onClick={(e) => {
              stop(e);
              onOpenEdit();
            }}
            className="rounded p-0.5 text-muted hover:text-gold-700"
            aria-label="تعديل الكارت"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="mt-1 truncate text-xs font-bold text-ink-950">{slot.course.name}</p>
      <p className="truncate text-[9px] text-muted">{slot.room || '—'}</p>
      {slot.course.professor?.name && (
        <p className="truncate text-[9px] text-gold-700/70">{slot.course.professor.name}</p>
      )}
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-border bg-coal p-3 text-center">
      <div className="mx-auto mb-1 text-gold-700">{icon}</div>
      <p className="text-xl font-extrabold text-ink-950">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function dayPeriodLabel(key: string) {  const { day, period } = parseKey(key);
  const d = SCHED_DAYS.find((x) => x.day === day);
  const p = SCHED_PERIODS.find((x) => x.period === period);
  return `${d?.ar || 'يوم'} ${p?.time || ''}`;
}

// ── مودال تحرير الكارت ──
function EditModal({
  slot,
  palette,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  slot: Slot;
  palette: Course[];
  busy: boolean;
  onClose: () => void;
  onSave: (patch: { kind: string; room: string; isVip: boolean; courseId: string }) => void;
  onDelete: () => void;
}) {
  const [kind, setKind] = React.useState(slot.kind);
  const [room, setRoom] = React.useState(slot.room || '');
  const [isVip, setIsVip] = React.useState(slot.isVip);
  const [courseId, setCourseId] = React.useState(slot.course.id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06110d]/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-gold-400/25 bg-coal p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-ink-950">
            <Pencil className="h-4 w-4 text-gold-700" /> تعديل الكارت
          </h3>
          <button onClick={onClose} className="text-muted hover:text-ink-950" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm text-muted">المادة</Label>
            <select
              dir="ltr"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border border-ink-border bg-ash px-3 py-2 text-sm text-ink-950"
            >
              {[...palette.filter((c) => c.id === slot.course.id), ...palette].reduce<Course[]>(
                (acc, c) => (acc.some((x) => x.id === c.id) ? acc : [...acc, c]),
                [],
              ).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted">النوع</Label>
            <div className="flex gap-2">
              {Object.entries(SCHED_KIND_LABEL).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-sm transition ${
                    kind === k
                      ? 'border-gold-400 bg-gold-400/15 text-gold-700'
                      : 'border-ink-border bg-ash text-muted hover:border-gold-400/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted">القاعة</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="قاعة 1 / VIP Hall 2 / معمل الحاسب" />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ivory">
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="h-4 w-4 accent-gold-400"
            />
            <Star className="h-4 w-4 fill-gold-400 text-gold-700" /> قاعة مميزة (VIP — توهج ذهبي)
          </label>

          <div className="flex items-center justify-between gap-2 pt-2">
            {confirmDelete ? (
              <Button variant="danger" size="sm" disabled={busy} onClick={onDelete}>
                <Trash2 className="h-4 w-4" /> تأكيد الحذف
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> حذف
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onSave({ kind, room: room.trim(), isVip, courseId })}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
