'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** spotlight follows the pointer inside the card */
  spotlight?: boolean;
  /** slow travelling sheen — use on KPI tiles only, never on tables */
  shine?: boolean;
  /** soft blue outer halo */
  glow?: boolean;
  /** lift on hover */
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
};

/**
 * The single surface primitive of the Obsidian Glass system.
 * Real glass = 1px hairline + inner top sheen + blurred backdrop, not opacity soup.
 */
export function GlassCard({
  spotlight = false,
  shine = false,
  glow = false,
  interactive = false,
  as = 'div',
  className,
  children,
  onMouseMove,
  ...rest
}: GlassCardProps) {
  const Tag = as as React.ElementType;

  const handleMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (spotlight) {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }
      onMouseMove?.(event);
    },
    [spotlight, onMouseMove],
  );

  return (
    <Tag
      {...rest}
      onMouseMove={handleMove}
      className={cn(
        'o-card',
        spotlight && 'o-spot',
        shine && 'o-shine',
        glow && 'o-card--glow',
        (interactive || spotlight) && 'o-card--hover',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function GlassPanelHeader({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="o-eyebrow">{eyebrow}</p> : null}
        <h2 className="o-heading mt-1 truncate text-[15px]">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
