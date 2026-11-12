'use client';

import * as React from 'react';

/*
 * ماركة رقيب v5 — «السداسي المخطط»:
 * العلامة = سداسي رأسي (رأسان أعلى/أسفل) مبني من خطوط مائلة متوازية «/»
 * مقصوصة داخل جسم السداسي، بممرّ فارغ قطري في المنتصف يقسمه لمجموعتين
 * (4 خطوط + 4 خطوط) — مطابقة للوجو المرجعي الجديد، بلا أي خلفية.
 * الكلمة «RAQIB» بخط هندسي سنس-سريف عريض التباعد (Space Grotesk المحمّل).
 * الأنبرات: ink → فحمي داكن (لون اللوجو الأصلي)، light → عاجي للخلفيات الداكنة،
 * gold → ذهبي لللمسات.
 */

type Tone = 'ink' | 'light' | 'gold';

type MarkProps = {
  className?: string;
  tone?: Tone;
  framed?: boolean;
};

export const BRAND_BLUE = '#1C74BC';

const TONES: Record<Tone, string> = {
  ink: '#26251E',
  light: '#F7F4E8',
  gold: '#C8A24B',
};

/* ── هندسة السداسي ──
 * سداسي رأسي مركزه (32,32) ونصف قطره R — رأسان أعلى وأسفل:
 *   (32, 32−R) · (32+R·sin60, 32−R/2) · (32+R·sin60, 32+R/2) · (32, 32+R) · (32−R·sin60, 32+R/2) · (32−R·sin60, 32−R/2)
 * الخطوط المائلة «/» هي مستقيمات x+y=c مقصوصة داخل السداسي.
 * المدى الفعلي لـ c داخل السداسي: [32−R+min… ] نحسبها لكل R.
 * الممرّ الفارغ = إسقاط خطّين من المنتصف (فجوة ≈ ضعف سماكة الخط). */

const SIN60 = 0.86603;

/** يبني نقاط السداسي + خطوط المائلة المقطوعة لمركز (32,32) ونصف قطر R */
function hexGeometry(R: number, strokeWidth: number) {
  const dx = R * SIN60;
  const dy = R / 2;
  const points = [
    [32, 32 - R],
    [32 + dx, 32 - dy],
    [32 + dx, 32 + dy],
    [32, 32 + R],
    [32 - dx, 32 + dy],
    [32 - dx, 32 - dy],
  ] as const;

  // مدى c = x+y داخل السداسي: أدنى قيمة عند الرأس العلوي الأيسر، وأعلاها عند السفلي الأيمن
  const cMin = Math.min(...points.map(([x, y]) => x + y)) + strokeWidth * 0.4;
  const cMax = Math.max(...points.map(([x, y]) => x + y)) - strokeWidth * 0.4;
  const step = (cMax - cMin) / 8; // 9 مواضع متساوية، نسقط الوضع الأوسط → 4+4 خطوط
  const lines: number[] = [];
  for (let i = 0; i <= 8; i += 1) {
    const c = cMin + i * step;
    if (i === 4) continue; // الممرّ المركزي الفارغ
    lines.push(Math.round(c * 100) / 100);
  }
  return { points, lines };
}

/** عناصر العلامة الداخلية — تُركّب في أي SVG */
function MarkInner({
  color,
  strokeWidth,
  R,
  id,
  drawClass,
}: {
  color: string;
  strokeWidth: number;
  R: number;
  id: string;
  drawClass?: string;
}) {
  const { points, lines } = hexGeometry(R, strokeWidth);
  return (
    <>
      <defs>
        <clipPath id={`rqb-hex-${id}`}>
          <polygon points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#rqb-hex-${id})`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        fill="none"
      >
        {lines.map((c, i) => (
          <line
            key={c}
            x1={4}
            y1={c - 4}
            x2={60}
            y2={c - 60}
            pathLength={drawClass ? 1 : undefined}
            className={drawClass}
            style={drawClass ? { animationDelay: `${0.06 * i}s` } : undefined}
          />
        ))}
      </g>
    </>
  );
}

/**
 * رمز رقيب الجديد: السداسي المخطط — عاري بلا خلفية (أو داخل بلوك أزرق عند framed).
 * أبعاد ثابتة 64×64 ويُقاس بالكلاس.
 */
export function LogoMark({ className, tone = 'ink', framed = false }: MarkProps) {
  const uid = React.useId().replace(/[:]/g, '');

  if (!framed) {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="RAQIB — رقيب"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <MarkInner color={TONES[tone]} strokeWidth={4.6} R={29} id={`b-${uid}`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="RAQIB — رقيب"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`rqb-mk-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2B84D2" />
          <stop offset="100%" stopColor={BRAND_BLUE} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#rqb-mk-${uid})`} />
      <MarkInner color="#FFFFFF" strokeWidth={3.6} R={21} id={`f-${uid}`} />
    </svg>
  );
}

/** نسخة مدمجة للكروم الكثيف وحالات الأيفون/الفافيكون */
export function LogoMarkLite({ className }: { className?: string }) {
  return <LogoMark className={className} tone="light" framed />;
}

/**
 * الكلمة كاملة: RAQIB بخط هندسي سنس-سريف — نفس روح اللوجو المرجعي الجديد.
 * نستخدم <text> مع textLength لضبط العُمدة عبر الأنظمة كلها.
 * Space Grotesk محمّل كمتغير خط على <html> — fallback هندسي أنيق بعده.
 */
export function LogoWordmark({ className, tone = 'ink' }: { className?: string; tone?: Tone }) {
  const color = TONES[tone];
  return (
    <svg
      viewBox="0 0 152 44"
      role="img"
      aria-label="RAQIB"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="38"
        textLength="150"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="var(--font-grotesk), 'Poppins', 'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif"
        fontWeight="600"
        fontSize="38"
        letterSpacing="2"
        fill={color}
      >
        RAQIB
      </text>
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tone?: Tone;
  showWordmark?: boolean;
  stacked?: boolean;
  showEnglish?: boolean;
};

export function Logo({
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'h-3.5',
  tone = 'ink',
  showWordmark = true,
  stacked = false,
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${stacked ? 'flex-col gap-2' : ''} ${className}`}
      aria-label="RAQIB — رقيب"
    >
      <LogoMark className={`${markClassName} shrink-0`} tone={tone} />
      {showWordmark && (
        <LogoWordmark className={wordmarkClassName} tone={tone} />
      )}
    </span>
  );
}
