'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import './TheaterCard.css';

export type TheaterCardVariant = 'default' | 'seat' | 'plaque' | 'ticket' | 'certificate' | 'exhibit' | 'metric' | 'tech';

interface TheaterCardProps {
  children: React.ReactNode;
  variant?: TheaterCardVariant;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  illuminated?: boolean;
  'aria-label'?: string;
  role?: string;
  tabIndex?: number;
}

const variantRadius: Record<TheaterCardVariant, string> = {
  default: '8px 28px 8px 28px',
  seat: '10px 30px 10px 30px',
  plaque: '14px 60px 14px 60px',
  ticket: '8px 24px 8px 24px',
  certificate: '12px 40px 12px 40px',
  exhibit: '8px 28px 8px 28px',
  metric: '8px 24px 8px 24px',
  tech: '6px 20px 6px 20px',
};

const variantOutlineOffset: Record<TheaterCardVariant, string> = {
  default: '-8px',
  seat: '-8px',
  plaque: '-10px',
  ticket: '-7px',
  certificate: '-10px',
  exhibit: '-8px',
  metric: '-7px',
  tech: '-6px',
};

const variantInnerInset: Record<TheaterCardVariant, string> = {
  default: '12px',
  seat: '12px',
  plaque: '14px',
  ticket: '10px',
  certificate: '14px',
  exhibit: '12px',
  metric: '10px',
  tech: '8px',
};

const variantInnerRadius: Record<TheaterCardVariant, string> = {
  default: '4px 18px 4px 18px',
  seat: '4px 20px 4px 20px',
  plaque: '6px 42px 6px 42px',
  ticket: '3px 13px 3px 13px',
  certificate: '4px 26px 4px 26px',
  exhibit: '4px 18px 4px 18px',
  metric: '3px 13px 3px 13px',
  tech: '3px 13px 3px 13px',
};

const variantCornerSize: Record<TheaterCardVariant, { w: string; h: string }> = {
  default: { w: '14px', h: '14px' },
  seat: { w: '16px', h: '16px' },
  plaque: { w: '18px', h: '18px' },
  ticket: { w: '12px', h: '12px' },
  certificate: { w: '16px', h: '16px' },
  exhibit: { w: '14px', h: '14px' },
  metric: { w: '12px', h: '12px' },
  tech: { w: '12px', h: '12px' },
};

const variantCornerBorder: Record<TheaterCardVariant, string> = {
  default: '2px',
  seat: '2px',
  plaque: '2.5px',
  ticket: '1.5px',
  certificate: '2px',
  exhibit: '2px',
  metric: '2px',
  tech: '2px',
};

export function TheaterCard({
  children,
  variant = 'default',
  className,
  interactive = false,
  onClick,
  illuminated = false,
  'aria-label': ariaLabel,
  role,
  tabIndex,
}: TheaterCardProps) {
  const reduceMotion = useReducedMotion();

  const radius = variantRadius[variant];
  const outlineOffset = variantOutlineOffset[variant];
  const innerInset = variantInnerInset[variant];
  const innerRadius = variantInnerRadius[variant];
  const cornerSize = variantCornerSize[variant];
  const cornerBorder = variantCornerBorder[variant];

  const style = {
    '--card-radius': radius,
    '--card-outline-offset': outlineOffset,
    '--card-inner-inset': innerInset,
    '--card-inner-radius': innerRadius,
    '--card-corner-w': cornerSize.w,
    '--card-corner-h': cornerSize.h,
    '--card-corner-border': cornerBorder,
  } as React.CSSProperties;

  const baseClass = cn(
    'theater-card',
    `theater-card--${variant}`,
    interactive && 'theater-card--interactive',
    illuminated && 'theater-card--illuminated',
    className
  );

  const Component = interactive && onClick ? 'button' : 'div';

  return (
    <Component
      className={baseClass}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role}
      tabIndex={tabIndex}
      disabled={interactive && !onClick}
    >
      <motion.div
        className="theater-card-inner"
        initial={false}
        animate={illuminated ? { scale: 1.002 } : {} }
        transition={reduceMotion ? { duration: 0 } : { duration: 300, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      <span className="theater-card-corner" aria-hidden />
      <span className="theater-card-glow" aria-hidden />
    </Component>
  );
}