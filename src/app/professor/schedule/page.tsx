'use client';

import * as React from 'react';
import { Eye, Loader2, MapPin, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { SCHED_DAYS, SCHED_KIND_LABEL, SCHED_PERIODS } from '@/lib/constants';

type Slot = {
  id: string;
  day: number;
  period: number;
  kind: string;
  room: string | null;
  isVip: boolean;
  course: { id: string; code: string; name: string };
};

function GroupSchedule({ slots, myCourseIds }: { slots: Slot[]; myCourseIds: Set<string> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {SCHED_DAYS.map((day) => (
        <Card key={day.day} className="border-gold-400/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-gold-gradient">{day.ar}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {SCHED_PERIODS.map((period) => {
              const slot = slots.find((s) => s.day === day.day && s.period === period.period);
              const mine = slot && myCourseIds.has(slot.course.id);
              return (
                <div
                  key={period.period}
                  className={`rounded-xl border px-3 py-2 transition ${
                    mine
                      ? 'border-gold-400/35 bg-gold-500/10'
                      : 'border-brand-900/[0.08] bg-white/600'
                  }`}
                >
                  <p className="font-latin text-[10px] text-ink-400" dir="ltr">
                    {period.from} – {period.to}
                  </p>
                  {mine && slot ? (
                    <>
                      <p className="mt-0.5 font-display text-sm font-bold text-gold-800">
                        {slot.course.code}
                        {slot.isVip ? <Sparkles className="ms-1 inline h-3.5 w-3.5" /> : null}
                      </p>
                      <p className="truncate text-xs text-ink-500">{slot.course.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-400">
                        <span className="font-bold text-ink-500">{SCHED_KIND_LABEL[slot.kind] || slot.kind}</span>
                        {slot.room ? (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {slot.room}
                          </span>
                        ) : null}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-ink-300">—</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProfessorSchedulePage() {
  const [groupSlots, setGroupSlots] = React.useState<Record<string, Slot[]>>({});
  const [myCourseIds, setMyCourseIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      api<{ courses: { id: string }[] }>('/api/courses'),
      api<{ slots: Slot[] }>('/api/schedule?group=A'),
      api<{ slots: Slot[] }>('/api/schedule?group=B'),
    ])
      .then(([c, a, b]) => {
        setMyCourseIds(new Set(c.courses.map((course) => course.id)));
        setGroupSlots({ A: a.slots, B: b.slots });
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const counts = Object.fromEntries(
    Object.entries(groupSlots).map(([group, slots]) => [
      group,
      slots.filter((slot) => myCourseIds.has(slot.course.id)).length,
    ]),
  );

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient">جدولي</h1>
          <p className="mt-1 text-ink-500">حصص مقرراتك داخل جدول الجروبين — من الأحد 08:30 حتى الخميس 16:30</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-gold-400/25 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-700">
          <Eye className="h-3.5 w-3.5" />
          عرض للقراءة فقط
        </span>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-gold-700" />
            جارٍ تحميل الجدول…
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p
          className="mb-6 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-3 py-2 text-sm text-ember-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <Tabs defaultValue="A">
          <TabsList>
            <TabsTrigger value="A">جروب A · {counts.A ?? 0} حصة</TabsTrigger>
            <TabsTrigger value="B">جروب B · {counts.B ?? 0} حصة</TabsTrigger>
          </TabsList>
          <TabsContent value="A">
            <GroupSchedule slots={groupSlots.A || []} myCourseIds={myCourseIds} />
          </TabsContent>
          <TabsContent value="B">
            <GroupSchedule slots={groupSlots.B || []} myCourseIds={myCourseIds} />
          </TabsContent>
        </Tabs>
      ) : null}

      <p className="mt-6 text-center text-xs text-ink-400">
        الخانات الذهبية هي حصصك فقط — باقي الجريد يظهر فارغًا لأنه يخص دكاترة آخرين
      </p>
    </DashboardShell>
  );
}
