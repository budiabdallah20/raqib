'use client';

/**
 * 🧭 معالج التهيئة الأول — يظهر مرة واحدة بعد ال دخول:
 * المستوى ← الجروب ← التخصص. تُحفظ في تفضيلات الجهاز لتحسين التجربة
 * (فلترة العرض والعدادات) — لا تغيّر بيانات مسجلك الرسمية عند الإدارة.
 */
import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Layers,
  Users,
  FlaskConical,
  PartyPopper,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { setPortalPrefs, usePortalPrefs } from '@/lib/portal-prefs';
import type { AuthUser } from '@/types';

const LEVELS = ['1', '2', '3', '4'];
const GROUPS = ['A', 'B'];
const MAJORS = ['رياضيات وعلوم الحاسب', 'علوم', 'حاسبات واقتصاد إلكتروني'];

export function OnboardingModal({ user }: { user: AuthUser | null }) {
  const prefs = usePortalPrefs();
  const [step, setStep] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    if (!prefs.onboarded) setVisible(true);
  }, [user, prefs.onboarded]);

  if (!visible) return null;

  const finish = (data: { level: string; group: string; major: string }) => {
    setPortalPrefs({ ...data, onboarded: true });
    setVisible(false);
  };

  const progress = [0, 1, 2];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[85] flex items-center justify-center bg-ink-950/45 p-4 backdrop-blur-sm"
        role="dialog"
        aria-label="التهيئة الأولى"
      >
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-gold-400/30 bg-white/93 shadow-[0_40px_120px_-30px_rgba(19,56,44,0.55)] backdrop-blur-2xl"
        >
          <div className="relative border-b border-brand-900/10 bg-gradient-to-l from-brand-500/[0.10] via-gold-500/[0.08] to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-700">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-bold text-ink-950">
                  ٣ خطوات سريعة ونكمّل
                </p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  تخصيصة بسيطة لبوابتك — محفوظة على جهازك تنها
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {progress.map((index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    index <= step ? 'bg-gradient-to-l from-gold-500 to-gold-700' : 'bg-brand-900/[0.10]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div key="l" {...stepMotion}>
                  <StepIcon icon={<Layers className="h-5 w-5" />} title="إنتي في أنهي فرقة؟" />
                  <div className="grid grid-cols-4 gap-2">
                    {LEVELS.map((level) => (
                      <PickerButton
                        key={level}
                        active={prefs.level === level}
                        onClick={() => {
                          setPortalPrefs({ level });
                          setStep(1);
                        }}
                      >
                        {level}
                      </PickerButton>
                    ))}
                  </div>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="g" {...stepMotion}>
                  <StepIcon icon={<Users className="h-5 w-5" />} title="أنهي جروب؟" />
                  <div className="grid grid-cols-2 gap-2">
                    {GROUPS.map((group) => (
                      <PickerButton
                        key={group}
                        active={prefs.group === group}
                        onClick={() => {
                          setPortalPrefs({ group });
                          setStep(2);
                        }}
                      >
                        جروب {group}
                      </PickerButton>
                    ))}
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div key="m" {...stepMotion}>
                  <StepIcon icon={<FlaskConical className="h-5 w-5" />} title="تخصصك إيه؟" />
                  <div className="space-y-2">
                    {MAJORS.map((major) => (
                      <PickerButton
                        key={major}
                        wide
                        active={prefs.major === major}
                        onClick={() => finish({ level: prefs.level, group: prefs.group, major })}
                      >
                        {major}
                      </PickerButton>
                    ))}
                    <CustomMajor onFinish={finish} onBack={() => setStep(1)} currentLevel={prefs.level} currentGroup={prefs.group} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-brand-900/10 bg-white/60 px-6 py-3.5">
            <button
              type="button"
              onClick={() => {
                setPortalPrefs({ onboarded: true });
                setVisible(false);
              }}
              className="text-[11px] text-ink-400 underline-offset-4 transition hover:text-ink-700 hover:underline"
            >
              تخطي — أعدّلها بعدين من الإعدادات
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 transition hover:text-ink-900"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                رجوع
              </button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const stepMotion = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function StepIcon({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-500/25 bg-brand-500/[0.10] text-brand-700">
        {icon}
      </span>
      <p className="font-display text-base font-bold text-ink-950">{title}</p>
    </div>
  );
}

function PickerButton({
  children,
  active,
  onClick,
  wide,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-sm font-bold transition-all duration-300 active:scale-[0.97] ${
        wide ? 'w-full text-right' : ''
      } ${
        active
          ? 'border-brand-500/40 bg-brand-500/[0.12] text-brand-700 emerald-ring'
          : 'border-brand-900/10 bg-white/65 text-ink-700 hover:-translate-y-0.5 hover:border-gold-400/40 hover:bg-gold-400/[0.06]'
      }`}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

/** تخصص غير مدرج — حقل يدوي صغير */
function CustomMajor({
  onFinish,
  onBack,
  currentLevel,
  currentGroup,
}: {
  onFinish: (data: { level: string; group: string; major: string }) => void;
  onBack: () => void;
  currentLevel: string;
  currentGroup: string;
}) {
  const [major, setMajor] = React.useState('');
  const [custom, setCustom] = React.useState(false);

  if (!custom) {
    return (
      <button
        type="button"
        onClick={() => setCustom(true)}
        className="text-[11px] text-ink-400 underline-offset-4 transition hover:text-gold-700 hover:underline"
      >
        تخصص تاني مش موجود؟ اكتبه بنفسك →
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gold-400/35 bg-gold-400/[0.07] p-2">
      <input
        autoFocus
        value={major}
        onChange={(event) => setMajor(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && major.trim().length >= 2) {
            onFinish({ level: currentLevel, group: currentGroup, major: major.trim() });
          }
        }}
        placeholder="اكتب تخصصك (٢ حروف على الأقل)"
        maxLength={60}
        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink-950 outline-none placeholder:text-ink-300"
      />
      <button
        type="button"
        disabled={major.trim().length < 2}
        onClick={() => onFinish({ level: currentLevel, group: currentGroup, major: major.trim() })}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-[#1c1503] transition disabled:opacity-40"
        aria-label="تأكيد التخصص"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-900/10 bg-white/70 text-ink-400 transition hover:text-ink-700"
        aria-label="رجوع"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** نموذج بطاقة إتمام التهيئة — تظهر بعد النهاية من الإعدادات عند الإعادة */
export function OnboardingDoneChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/[0.08] px-3 py-1 text-[11px] font-bold text-brand-700">
      <PartyPopper className="h-3.5 w-3.5" />
      ابعتها — تهيئتك اتحفظت
    </span>
  );
}
