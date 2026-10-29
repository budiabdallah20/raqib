'use client';

/**
 * 🍅 مؤقت تركيز البومودورو — ٢٥ دقيقة تركيز / ٥ راحة، مع اختيار المادة،
 * سجل جلساتي اليوم محفوظ محليًا + احتفال مركّز عند كل إنجاز.
 */
import * as React from 'react';
import { Coffee, Pause, Play, RotateCcw, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientRing } from './MiniCharts';
import { celebrate } from '@/lib/celebrate';
import { addPomodoroSession, pomodoroToday, usePortalPrefs } from '@/lib/portal-prefs';
import { EmptyState } from './EmptyState';

const FOCUS_MIN = 25;
const BREAK_MIN = 5;
const RING_ID = 'pomo';

type Mode = 'focus' | 'break';

export function PomodoroTimer({ courses }: { courses: { code: string; name: string }[] }) {
  const prefs = usePortalPrefs();
  const todayLogs = React.useMemo(() => pomodoroToday(), [prefs.pomodoroSessions, prefs.pomodoroDay]);
  const [mode, setMode] = React.useState<Mode>('focus');
  const [remaining, setRemaining] = React.useState(FOCUS_MIN * 60);
  const [running, setRunning] = React.useState(false);
  const [course, setCourse] = React.useState(courses[0]?.code ?? '');
  const endAtRef = React.useRef<number | null>(null);

  const totalMin = mode === 'focus' ? FOCUS_MIN : BREAK_MIN;
  const pct = 100 - (remaining / (totalMin * 60)) * 100;

  // تمزامن كل ثانية
  React.useEffect(() => {
    if (!running) return;
    if (endAtRef.current === null) endAtRef.current = Date.now() + remaining * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAtRef.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        finish();
      }
    }, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // اختيار أول مادة لو اتغيرت القايمة
  React.useEffect(() => {
    if (!course && courses.length) setCourse(courses[0].code);
  }, [courses, course]);

  const finish = () => {
    setRunning(false);
    endAtRef.current = null;
    if (mode === 'focus') {
      addPomodoroSession(FOCUS_MIN, course || 'عام');
      celebrate();
      setMode('break');
      setRemaining(BREAK_MIN * 60);
    } else {
      setMode('focus');
      setRemaining(FOCUS_MIN * 60);
    }
  };

  const toggle = () => {
    if (running) {
      setRunning(false);
      endAtRef.current = null;
    } else {
      endAtRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    endAtRef.current = null;
    setMode('focus');
    setRemaining(FOCUS_MIN * 60);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const focusDoneToday = todayLogs.reduce((acc, log) => acc + log.minutes, 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>تركيز البومودورو</CardTitle>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
          mode === 'focus'
            ? 'border-brand-500/25 bg-brand-500/[0.08] text-brand-700'
            : 'border-gold-400/35 bg-gold-400/[0.10] text-gold-800'
        }`}>
          {mode === 'focus' ? <Hourglass className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
          {mode === 'focus' ? 'وقت تركيز' : 'استراحة قهوة'}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-5">
          <GradientRing
            id={RING_ID}
            pct={pct}
            from={mode === 'focus' ? '#2c8f84' : '#c8a24b'}
            to={mode === 'focus' ? '#4db8ae' : '#f0e0a9'}
            size={124}
          >
            <span className="font-display text-3xl font-black tabular-nums text-ink-950" dir="ltr">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold text-ink-400">{mode === 'focus' ? 'تركيز' : 'راحة'}</span>
          </GradientRing>
          <div className="min-w-[180px] flex-1 space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={toggle}
                className="col-span-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-4 py-2.5 text-sm font-bold text-[#1c1503] shadow-[0_10px_26px_-10px_rgba(200,162,75,.55)] transition hover:brightness-[1.06] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-1.5">
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {running ? 'وقّف مؤقتًا' : 'ابدأ التركيز'}
                </span>
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center justify-center rounded-xl border border-brand-900/10 bg-white/70 px-2 text-ink-400 transition hover:text-ember-600"
                aria-label="إعادة المؤقت"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            {courses.length ? (
              <select
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                className="w-full rounded-xl border border-brand-900/12 bg-white/80 px-3 py-2 text-xs font-bold text-ink-800 outline-none transition focus:border-gold-400/50"
                aria-label="المادة اللي تراجعه"
              >
                {courses.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex items-center justify-between rounded-xl border border-brand-900/10 bg-white/65 px-3 py-2 text-[11px]">
              <span className="font-bold text-ink-500">النهاردة حجزت</span>
              <span className="font-display font-black text-brand-700" dir="ltr">
                {todayLogs.length} جلسة · {focusDoneToday} د
              </span>
            </div>
          </div>
        </div>
        {todayLogs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {todayLogs.slice(-8).map((log, index) => (
              <span
                key={log.at}
                title={`${log.course} · ${new Date(log.at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
                className="rounded-lg border border-brand-500/20 bg-brand-500/[0.07] px-2 py-0.5 text-[9.5px] font-bold text-brand-700"
              >
                {index + 1}. {log.minutes}د · {log.course}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState kind="notes" compact title="ابدأ أول جلقة تركيز — ٢٥ دقيقة وخلاص" />
        )}
      </CardContent>
    </Card>
  );
}
