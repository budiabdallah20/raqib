'use client';

/**
 * ☀️ شريط التركيز الذكي — ترحيب متغير بالوقت + خلاصة يومك في سطر
 * (المحاضرة الجاية / التسليمات المتأخرة) + إجراءات سريعة.
 */
import * as React from 'react';
import { Moon, ScanLine, Sparkles, Sunset, Sunrise, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCAN_EVENT, openPalette } from '@/lib/commands';

type Phase = 'dawn' | 'noon' | 'evening' | 'night';

const PHASE_META: Record<Phase, { label: string; icon: typeof Sunrise; gradient: string }> = {
  dawn: { label: 'صباح الخير', icon: Sunrise, gradient: 'from-brand-500/[0.14] via-gold-500/[0.10] to-transparent' },
  noon: { label: 'نهار سعيد', icon: Sunset, gradient: 'from-gold-500/[0.16] via-brand-500/[0.08] to-transparent' },
  evening: { label: 'مساء الخير', icon: Moon, gradient: 'from-sapphire-500/[0.14] via-brand-500/[0.08] to-transparent' },
  night: { label: 'ليلة هادئة', icon: Moon, gradient: 'from-ink-950/[0.10] via-brand-500/[0.08] to-transparent' },
};

function phaseOf(hour: number): Phase {
  if (hour < 12) return 'dawn';
  if (hour < 17) return 'noon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function FocusBanner({
  name,
  upcoming,
  lateTasks,
}: {
  name: string;
  upcoming: {
    title: string;
    code: string;
    kind: string;
    room: string | null;
    time: string;
    daysUntil: number;
  } | null;
  lateTasks: number;
}) {
  const [phase, setPhase] = React.useState<Phase>('dawn');
  const [clock, setClock] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setPhase(phaseOf(now.getHours()));
      setClock(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const meta = PHASE_META[phase];
  const Icon = meta.icon;
  const firstName = name.split(' ')[0] || name;

  const dayLine = upcoming
    ? upcoming.daysUntil <= 0
      ? `محاضرتك الجاية «${upcoming.title}» النهاردة ${upcoming.time}${upcoming.room ? ` · ${upcoming.room}` : ''}`
      : `أقرب حصة لك «${upcoming.title}» بعد ${upcoming.daysUntil === 1 ? 'بكرة' : `${upcoming.daysUntil} أيام`}`
    : 'مفيش محاضرات جاية بالجدول — ركّز في التسليمات';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-l ${meta.gradient} p-5 shadow-glass backdrop-blur-xl`}
    >
      <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-gold-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 right-1/3 h-40 w-40 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-lg font-black text-ink-950">
            <Icon className="h-5 w-5 text-gold-700" />
            {meta.label} يا {firstName} 🌤️
            <span className="ms-1 rounded-full border border-white/70 bg-white/60 px-2 py-0.5 text-[10px] font-bold text-ink-500" dir="ltr">
              {clock}
            </span>
          </p>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-ink-500">
            {dayLine}
          </p>
          {lateTasks > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/[0.09] px-3 py-1 text-[11px] font-bold text-ember-600">
              <ClipboardList className="h-3.5 w-3.5" />
              عليك {lateTasks} تسليم متأخر — عالجها بجلقة راجعة واحدة
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(SCAN_EVENT))}
            className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-4 py-2.5 text-xs font-bold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.55)] transition hover:-translate-y-0.5 hover:brightness-[1.06] active:translate-y-0 active:scale-[0.98]"
          >
            <ScanLine className="h-4 w-4" />
            امسح كود الحضور
          </button>
          <button
            type="button"
            onClick={openPalette}
            className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-xs font-bold text-ink-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] transition hover:-translate-y-0.5 hover:border-brand-500/30 hover:text-ink-950"
          >
            <Sparkles className="h-4 w-4" />
            لوحة الأوامر
            <kbd className="hidden rounded-md border border-brand-900/15 bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-ink-400 sm:inline">
              Ctrl K
            </kbd>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
