/**
 * 🎨 توليد أصول الهوية — رقيب RAQiB (v5 «السداسي المخطط»)
 * نفس هندسة src/components/shared/Logo.tsx حرفيًا:
 * سداسي رأسي من خطوط مائلة «/» مقصوصة داخله + ممرّ مركزي، بلا أي خلفية.
 *
 * المخرجات:
 *   public/brand/logo-mark.svg        (العلامة عارية — فحمي)
 *   public/brand/logo-inverse.svg     (العلامة عارية — عاجي)
 *   public/brand/logo-primary.svg     (علامة + كلمة RAQIB)
 *   public/brand/logo-mono.svg        (فحمي كامل)
 *   public/brand/logo-gold-bg.svg     (بلوك ذهبي + خطوط بيضاء)
 *   public/brand/logo-black.svg       (أسود نقي)
 *   public/logo.svg · public/logo-mark.svg · public/logo-black.svg
 *   public/brand/icon-512.png · icon-192.png · icon-32.png · apple-touch-icon.png
 *
 * الاستخدام: node scripts/brand-hex.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const BRAND = path.join(process.cwd(), 'public', 'brand');
const PUBLIC = path.join(process.cwd(), 'public');
fs.mkdirSync(BRAND, { recursive: true });

const CHARCOAL = '#26251E';
const IVORY = '#F7F4E8';
const GOLD = '#C8A24B';
const BLACK = '#000000';
const BLUE_A = '#2B84D2';
const BLUE_B = '#1C74BC';

/* ── نفس هندسة Logo.tsx ── */
function hexGeometry(R, strokeWidth) {
  const SIN60 = 0.86603;
  const dx = R * SIN60;
  const dy = R / 2;
  const points = [
    [32, 32 - R],
    [32 + dx, 32 - dy],
    [32 + dx, 32 + dy],
    [32, 32 + R],
    [32 - dx, 32 + dy],
    [32 - dx, 32 - dy],
  ];
  const cMin = Math.min(...points.map(([x, y]) => x + y)) + strokeWidth * 0.4;
  const cMax = Math.max(...points.map(([x, y]) => x + y)) - strokeWidth * 0.4;
  const step = (cMax - cMin) / 8;
  const lines = [];
  for (let i = 0; i <= 8; i += 1) {
    if (i === 4) continue; // الممرّ المركزي
    lines.push(Math.round((cMin + i * step) * 100) / 100);
  }
  return { points, lines };
}

function markInner({ color, strokeWidth = 4.6, R = 29, clipId }) {
  const { points, lines } = hexGeometry(R, strokeWidth);
  return `
  <defs><clipPath id="${clipId}"><polygon points="${points.map(([x, y]) => `${x},${y}`).join(' ')}"/></clipPath></defs>
  <g clip-path="url(#${clipId})" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="butt" fill="none">
    ${lines.map((c) => `<line x1="4" y1="${c - 4}" x2="60" y2="${c - 60}"/>`).join('\n    ')}
  </g>`;
}

function bareMarkSvg({ color, size = 512, clipId }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" role="img" aria-label="RAQIB — رقيb">
  ${markInner({ color, clipId })}
</svg>`.replace('رقيb', 'رقيب');
}

/** بلوك أزرق مدوّر + خطوط بيضاء — أيقونة التطبيق */
function appIconSvg(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" role="img" aria-label="RAQIB — رقيب">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BLUE_A}"/><stop offset="100%" stop-color="${BLUE_B}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#g)"/>
  ${markInner({ color: '#FFFFFF', strokeWidth: 3.6, R: 21, clipId: 'hexf' })}
</svg>`;
}

/** بلوك بلون ما + خطوط بلون ما */
function blockMarkSvg({ block, stripes, size = 512 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" role="img" aria-label="RAQIB — رقيب">
  <rect x="2" y="2" width="60" height="60" rx="15" fill="${block}"/>
  ${markInner({ color: stripes, strokeWidth: 3.6, R: 21, clipId: 'hexb' })}
</svg>`;
}

/** علامة + كلمة RAQIB — لوجو أفقي كامل */
function lockupSvg({ markColor, textColor }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="160" viewBox="0 0 280 80" fill="none" role="img" aria-label="RAQiB — رقيب">
  <g transform="translate(8,8) scale(1)">${markInner({ color: markColor, clipId: 'hexl' })}</g>
  <text x="86" y="56" fontFamily="'Poppins','Futura','Century Gothic','Trebuchet MS',sans-serif" font-weight="600" font-size="40" letter-spacing="3" fill="${textColor}">RAQIB</text>
</svg>`;
}

const write = (file, content) => {
  fs.writeFileSync(file, content.trim() + '\n', 'utf8');
  console.log('✓', path.relative(process.cwd(), file));
};

/* ── SVGs ── */
write(path.join(BRAND, 'logo-mark.svg'), bareMarkSvg({ color: CHARCOAL, clipId: 'hm' }));
write(path.join(BRAND, 'logo-inverse.svg'), bareMarkSvg({ color: IVORY, clipId: 'hi' }));
write(path.join(BRAND, 'logo-black.svg'), bareMarkSvg({ color: BLACK, clipId: 'hb' }));
write(path.join(BRAND, 'logo-primary.svg'), lockupSvg({ markColor: CHARCOAL, textColor: CHARCOAL }));
write(path.join(BRAND, 'logo-mono.svg'), lockupSvg({ markColor: CHARCOAL, textColor: CHARCOAL }));
write(path.join(BRAND, 'logo-gold-bg.svg'), blockMarkSvg({ block: GOLD, stripes: '#FFFFFF' }));
write(path.join(PUBLIC, 'logo-mark.svg'), bareMarkSvg({ color: CHARCOAL, clipId: 'pm' }));
write(path.join(PUBLIC, 'logo-black.svg'), bareMarkSvg({ color: BLACK, clipId: 'pb' }));
write(path.join(PUBLIC, 'logo.svg'), lockupSvg({ markColor: CHARCOAL, textColor: CHARCOAL }));
write(path.join(PUBLIC, 'icon.svg'), appIconSvg());

/* ── PNGs بالـ sharp ── */
const iconSvg = Buffer.from(appIconSvg(512));
const targets = [
  { file: path.join(BRAND, 'icon-512.png'), size: 512 },
  { file: path.join(BRAND, 'icon-192.png'), size: 192 },
  { file: path.join(BRAND, 'icon-32.png'), size: 32 },
  { file: path.join(BRAND, 'apple-touch-icon.png'), size: 180 },
];
for (const t of targets) {
  await sharp(iconSvg, { density: 300 }).resize(t.size, t.size).png().toFile(t.file);
  console.log('✓', path.relative(process.cwd(), t.file));
}

console.log('\n🎨 هوية السداسي المخطط اتولدت بالكامل.');
