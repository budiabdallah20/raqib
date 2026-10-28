import type { CourseZone } from '@/lib/grades';

const ZONE_META: Record<CourseZone, { label: string; cls: string; dot: string }> = {
  GREEN: {
    label: 'ممتاز / آمن',
    cls: 'border-brand-500/30 bg-brand-500/[0.09] text-brand-700',
    dot: 'bg-brand-500',
  },
  YELLOW: {
    label: 'يحتاج تحسين',
    cls: 'border-gold-500/40 bg-gold-500/[0.10] text-gold-800',
    dot: 'bg-gold-400',
  },
  RED: {
    label: 'في خطر',
    cls: 'border-ember-500/30 bg-ember-500/[0.09] text-ember-600',
    dot: 'bg-ember-500',
  },
};

/** شارة حالة المادة: أخضر (متقدم) · ذهبي (تحذير لطيف) · أحمر (تنبيه مبكر) */
export function ZoneBadge({ zone, className }: { zone: CourseZone; className?: string }) {
  const meta = ZONE_META[zone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.cls} ${className ?? ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/** جملة التحذير المرافقة للمنطقة — كما في البريف */
export function zoneHint(zone: CourseZone): string | null {
  if (zone === 'GREEN') return 'مستواك متقدم — حافظ على الوتيرة';
  if (zone === 'YELLOW') return 'ركّز في الفاينل لتفادي هبوط التقدير';
  return 'تنبيه مبكر: وضعك يحتاج تدخلاً عاجلاً قبل الفاينل';
}
