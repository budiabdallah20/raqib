import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatsCard({
  title,
  value,
  hint,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn('border-glow', className)}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-ink-500">{title}</p>
          <p className="mt-1 font-display text-3xl font-bold text-ink-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
        </div>
        <div className="rounded-2xl border border-brand-500/15 bg-brand-500/10 p-3 text-brand-700">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
