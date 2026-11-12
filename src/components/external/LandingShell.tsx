'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StageBackground } from './StageBackground';
import { ProsceniumArch } from './ProsceniumArch';
import { VelvetCurtain } from './VelvetCurtain';
import { SpotlightBeam } from './SpotlightBeam';
import { StageFootlights } from './StageFootlights';
import './LandingShell.css';

interface LandingShellProps {
  children: React.ReactNode;
  className?: string;
  showCurtains?: boolean;
  showSpotlights?: boolean;
  showFootlights?: boolean;
  showProscenium?: boolean;
}

export function LandingShell({
  children,
  className,
  showCurtains = true,
  showSpotlights = true,
  showFootlights = true,
  showProscenium = true,
}: LandingShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('landing-shell', className)} data-experience="theater">
      <StageBackground>
        {showProscenium && <ProsceniumArch variant="hero" />}
        {showSpotlights && (
          <>
            <SpotlightBeam position="left" />
            <SpotlightBeam position="right" />
          </>
        )}
        {showFootlights && <StageFootlights />}
        {showCurtains && (
          <>
            <VelvetCurtain side="left" />
            <VelvetCurtain side="right" />
          </>
        )}
        <div className="landing-shell-content">
          {children}
        </div>
      </StageBackground>
    </div>
  );
}