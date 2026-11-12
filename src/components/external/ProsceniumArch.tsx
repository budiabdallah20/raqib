'use client';

import * as React from 'react';
import './ProsceniumArch.css';

interface ProsceniumArchProps {
  className?: string;
  variant?: 'hero' | 'section' | 'compact';
}

export function ProsceniumArch({ className, variant = 'hero' }: ProsceniumArchProps) {
  const baseClass = `proscenium-arch proscenium-arch--${variant}`;
  return (
    <div className={`${baseClass} ${className ?? ''}`} aria-hidden>
      <div className="proscenium-arch-inner" />
      <div className="proscenium-crown" />
    </div>
  );
}