'use client';

import * as React from 'react';
import './StageBackground.css';

export function StageBackground({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`stage-background ${className ?? ''}`} data-experience="theater">
      <div className="stage-bg-base" aria-hidden />
      <div className="stage-bg-vignette" aria-hidden />
      <div className="stage-bg-grid" aria-hidden />
      {children}
    </div>
  );
}