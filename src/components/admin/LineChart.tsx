'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

type Props = {
  data: { date: string; count: number }[];
  height?: number;
};

/** مخطط خطي يدوي بـ SVG — polyline خفيف بدون أي مكتبة رسوم */
export function LineChart({ data, height = 180 }: Props) {
  const width = 560;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.count));
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - pad - (d.count / max) * (height - pad * 2),
  }));
  const path = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full overflow-hidden" dir="ltr">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full" preserveAspectRatio="none">
        {/* خطوط أفقية إرشادية */}
        {[0, 0.5, 1].map((t) => {
          const y = height - pad - t * (height - pad * 2);
          return <line key={t} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(20,121,95,0.16)" strokeDasharray="4 6" />;
        })}
        <motion.polyline
          points={path}
          fill="none"
          stroke="#14795f"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f9fbf9" stroke="#14795f" strokeWidth="2" />
        ))}
        {/* تسميات أول وآخر يوم من المحور السيني */}
        {data.length > 0 ? (
          <>
            <text x={pad} y={height - 6} fontSize="10" fill="rgba(11,31,25,0.45)" textAnchor="start">
              {data[0].date}
            </text>
            <text x={width - pad} y={height - 6} fontSize="10" fill="rgba(11,31,25,0.45)" textAnchor="end">
              {data[data.length - 1].date}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
