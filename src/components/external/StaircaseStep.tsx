'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import './StaircaseStep.css';

interface StaircaseStepProps {
  children: React.ReactNode;
  number: number;
  label: string;
  description?: string;
  illuminated?: boolean;
  className?: string;
  onClick?: () => void;
  'aria-current'?: 'step' | 'true' | 'false';
}

export function StaircaseStep({
  children,
  number,
  label,
  description,
  illuminated = false,
  className,
  onClick,
  'aria-current': ariaCurrent,
}: StaircaseStepProps) {
  const reduceMotion = useReducedMotion();

  const baseClass = cn(
    'staircase-step',
    illuminated && 'staircase-step--illuminated',
    onClick && 'staircase-step--clickable',
    className
  );

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={baseClass}
      onClick={onClick}
      aria-current={ariaCurrent}
      aria-label={`Step ${number}: ${label}`}
      disabled={onClick && illuminated}
    >
      <span className="staircase-step-riser" aria-hidden />
      <div className="staircase-step-tread">
        <div className="staircase-step-marker" aria-hidden>
          <span className="staircase-step-number">{number}</span>
          <span className="staircase-step-label">{label}</span>
        </div>
        {description && <p className="staircase-step-description">{description}</p>}
        <div className="staircase-step-content">{children}</div>
      </div>
      <span className="staircase-step-glow" aria-hidden />
      <span className="staircase-step-corner" aria-hidden />
    </Component>
  );
}

interface StaircaseStepsProps {
  steps: Array<{
    number: number;
    label: string;
    description?: string;
    content: React.ReactNode;
    illuminated?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  rtl?: boolean;
}

export function StaircaseSteps({ steps, className, direction = 'vertical', rtl = false }: StaircaseStepsProps) {
  return (
    <div
      className={cn('staircase-steps', `staircase-steps--${direction}`, rtl && 'staircase-steps--rtl', className)}
      role="list"
      aria-label="Registration steps"
    >
      <ol className="staircase-steps-list">
        {steps.map((step, index) => (
          <li key={step.number} className="staircase-steps-item" role="listitem">
            <StaircaseStep
              number={step.number}
              label={step.label}
              description={step.description}
              illuminated={step.illuminated}
              onClick={step.onClick}
              aria-current={step.illuminated ? 'step' : undefined}
            >
              {step.content}
            </StaircaseStep>
          </li>
        ))}
      </ol>
      <div className="staircase-steps-spotlight" aria-hidden />
    </div>
  );
}