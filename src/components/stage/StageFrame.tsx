import * as React from 'react';

type FrameKind = 'gallery' | 'gateway' | 'credential' | 'plaque';

export function StageFrame({
  children,
  kind = 'gallery',
  interactive = false,
  className = '',
  style,
}: {
  children: React.ReactNode;
  kind?: FrameKind;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`stage-frame stage-frame--${kind}${interactive ? ' stage-frame--interactive' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
