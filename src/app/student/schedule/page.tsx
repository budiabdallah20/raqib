'use client';

import * as React from 'react';
import { CalendarPlus, Printer, Signal } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RowsSkeleton } from '@/components/student/Skeletons';
import { api } from '@/lib/api';
import { buildScheduleICS, downloadBlob } from '@/lib/exporters';
import { toast } from '@/components/student/PortalAgent';
import { SCHED_DAYS, SCHED_KIND_LABEL, SCHED_PERIODS } from '@/lib/constants';

type Slot = {
  id: string;
  day: number;
  period: number;
  kind: string;
  room: string | null;
  isVip: boolean;
  course: {
    id: string;
    code: string;
    name: string;
    englishName: string | null;
    professor: { name: string };
  };
};

// هل الوقت الحالي داخل حصة؟ نرجّع فهرس الحصة أو -1
function currentPeriodIndex(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return SCHED_PERIODS.findIndex((period) => {
    const [fromHour, fromMinute] = period.from.split(':').map(Number);
    const [toHour, toMinute] = period.to.split(':').map(Number);
    return (
      minutes >= fromHour * 60 + fromMinute && minutes <= toHour * 60 + toMinute
    );
  });
}

export default function StudentSchedulePage() {
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [group, setGroup] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    api<{ group: string; slots: Slot[] }>('/api/schedule')
      .then((data) => {
        setSlots(data.slots || []);
        setGroup(data.group);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // تحديث مؤشر الوقت كل دقيقة — بلا أي تخزين محلي
  React.useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const todayDay = React.useMemo(() => {
    void tick; // تحديث عند مرور الدقائق (تغيّر اليوم بعد منتصف الليل)
    return new Date().getDay() + 1; // 1=الأحد .. 7=السبت
  }, [tick]);

  const activePeriod = React.useMemo(() => {
    void tick;
    return currentPeriodIndex();
  }, [tick]);

  const byCell = React.useMemo(() => {
    const map = new Map<string, Slot>();
    slots.forEach((slot) => {
      map.set(`${slot.day}-${slot.period}`, slot);
    });
    return map;
  }, [slots]);

  // 📅 تصدير الجدول لتقويم Google/الجوال (ICS بمدى ٨ أسابيع)
  const exportIcs = () => {
    if (!slots.length) return;
    const slotsIcs = slots
      .map((slot) => {
        const period = SCHED_PERIODS[slot.period - 1];
        if (!period) return null;
        return {
          day: slot.day,
          from: period.from,
          to: period.to,
          title: slot.course.name,
          code: slot.course.code,
          room: slot.room,
          teacher: slot.course.professor?.name ?? null,
        };
      })
      .filter(Boolean) as Parameters<typeof buildScheduleICS>[0];
    downloadBlob('raqib-schedule.ics', 'text/calendar;charset=utf-8', buildScheduleICS(slotsIcs, 8));
    toast('نزّلت جدولك ICS — افتحه في Google Calendar 📆');
  };

  return (
    <StudentShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">الجدول الأسبوعي</h1>
          <p className="mt-1 text-ink-500">
            جروب {group || '—'} · عرض فقط — التعديل للأدمن
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-900/10 bg-white/65 px-3 py-1.5 text-xs font-bold text-ink-500">
            {slots.length} حصة أسبوعيًا
          </span>
          <Button variant="outline" onClick={exportIcs} disabled={!slots.length}>
            <CalendarPlus className="h-4 w-4" />
            تقويم ICS
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            اطبع الجدول
          </Button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <RowsSkeleton rows={5} />
      ) : (
        <Card className="print-area">
          <CardContent className="overflow-x-auto p-4 sm:p-6">
            <div className="min-w-[860px] space-y-3">
              {/* رأس الأيام */}
              <div className="grid grid-cols-[130px_repeat(4,minmax(0,1fr))] gap-3">
                <div />
                {SCHED_DAYS.map(({ day, ar }) => (
                  <div
                    key={day}
                    className={`rounded-xl border py-3 text-center font-display text-sm font-bold ${
                      todayDay === day
                        ? 'border-gold-400/60 bg-gold-400/15 text-gold-800 shadow-gold-soft'
                        : 'border-brand-900/10 bg-white/60 text-ink-600'
                    }`}
                  >
                    {ar}
                  </div>
                ))}
              </div>

              {/* صفوف الحصص */}
              {SCHED_PERIODS.map((period) => (
                <div
                  key={period.period}
                  className="grid grid-cols-[130px_repeat(4,minmax(0,1fr))] gap-3"
                >
                  <div className="flex flex-col justify-center rounded-xl border border-brand-900/10 bg-white/65 px-3 py-4 text-center">
                    <p className="text-xs font-bold text-ink-700">{period.label}</p>
                    <p className="mt-1 text-[11px] text-ink-400" dir="ltr">
                      {period.time}
                    </p>
                    {activePeriod === period.period - 1 ? (
                      <span className="mt-1 text-[10px] font-bold text-gold-700">
                        ← الآن
                      </span>
                    ) : null}
                  </div>
                  {SCHED_DAYS.map(({ day }) => {
                    const slot = byCell.get(`${day}-${period.period}`);
                    if (!slot) {
                      return (
                        <div
                          key={day}
                          className="flex min-h-[96px] items-center justify-center rounded-2xl border border-dashed border-brand-900/10 bg-white/65 text-xs text-ink-300"
                        >
                          ☕ فراغ
                        </div>
                      );
                    }
                    const vip = slot.isVip;
                    const isLive = todayDay === day && activePeriod === period.period - 1;
                    return (
                      <div
                        key={day}
                        className={`min-h-[96px] rounded-2xl border p-3.5 ${
                          isLive
                            ? 'border-brand-500/50 bg-brand-500/[0.10] animate-pulse-ring shadow-[0_0_0_3px_rgba(44,143,132,0.12)]'
                            : vip
                              ? 'border-gold-400/45 bg-gold-400/10 shadow-gold-soft'
                              : todayDay === day
                                ? 'border-gold-400/30 bg-white/60'
                                : 'border-brand-900/10 bg-white/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold text-gold-700">
                            {slot.course.code}
                          </span>
                          {vip ? (
                            <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-xs text-gold-800">
                              ⭐ VIP
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-bold leading-snug text-ink-950">
                          {slot.course.name}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {SCHED_KIND_LABEL[slot.kind] ?? slot.kind}
                          {slot.room ? ` · ${slot.room}` : ''}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          د. {slot.course.professor?.name ?? 'غير محدد'}
                        </p>
                        {isLive ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-brand-500/40 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                            <Signal className="h-3 w-3" />
                            جارية الآن
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* مؤشر «الآن» — نص فرعي بسيط بلا أي تخزين */}
      {!loading && !error ? (
        <p className="no-print mt-4 text-center text-sm text-ink-500">
          الآن:{' '}
          {activePeriod >= 0 ? (
            <span className="font-bold text-gold-700">
              {SCHED_PERIODS[activePeriod].label} ({SCHED_PERIODS[activePeriod].time})
            </span>
          ) : (
            <span className="text-ink-500">خارج أوقات الحصص</span>
          )}
        </p>
      ) : null}
    </StudentShell>
  );
}
