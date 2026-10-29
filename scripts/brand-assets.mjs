/**
 * 🎨 توليد حزمة أصول الهوية — رقيب RAQiB (v3)
 * «RAQIB بالبلوك»: حروف مدورة سميكة + بلوك B صلب مُفرَّغ أبيض — بلا شِعار جانبي.
 * نفس هندسة src/components/shared/Logo.tsx (Wordmark 190×64 · Block 64×64).
 * المخرجات: SVG أربع نسخ + PNG 512/192/180/32 + أيقونات src/app + OG 1200×630.
 *
 * الاستخدام: npm run brand:assets
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'brand');
fs.mkdirSync(OUT, { recursive: true });

const TERRA = '#C4552F';
const INK = '#0b0e06';
const GOLD = '#C8A24B';
const MONO = '#16130E';

/* لوحات النسخ: block=null يعني بلوك مفتوح (خطوط B بلا خلفية) */
const PALETTES = {
  mark: { block: TERRA, b: '#ffffff' },
  mono: { block: MONO, b: '#ffffff' },
  inverse: { block: null, b: TERRA },
  gold: { block: GOLD, b: '#ffffff' },
};

/* ── مسارات مشتركة ── */
const BLOCK_B = `M20 48V16
M20 16h11a7.5 7.5 0 1 1 0 15h-11
M20 31h13a7.5 7.5 0 1 1 0 17h-13`;

const LETTERS = `M8 15V49
M8 15h14a11.5 11.5 0 1 1 0 23H8
M22 38L32.5 49
M50 49L60 15L70 49
M54.5 35H65.5
M98 31.5m-16.5 0a16.5 16.5 0 1 0 33 0a16.5 16.5 0 1 0 -33 0
M106.5 43.5L114 50.5
M128 15V49`;

/** البلوك الداخلي (rect + B) — للتركيب داخل أي SVG */
function blockInner(palette, extra = '') {
  if (palette.block == null) {
    return `<g stroke="${palette.b}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="${BLOCK_B}"/>${extra}
    </g>`;
  }
  return `<rect x="4" y="4" width="56" height="56" rx="15" fill="${palette.block}"/>
  <g stroke="${palette.b}" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="${BLOCK_B}"/>${extra}
  </g>`;
}

function blockSvg(palette, size = 64) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">${blockInner(palette)}</svg>`;
}

/** حروف RAQI مدورة (بلا بلوك) — لون واحد */
function lettersInner(color, strokeWidth = 11, extra = '') {
  return `<g stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${LETTERS.split('\n').map((d) => `<path d="${d.trim()}"/>`).join('')}${extra}
  </g>`;
}

/* ── نسخ الهوية (نفس أسماء الملفات) ── */
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), blockSvg(PALETTES.mark));
fs.writeFileSync(path.join(OUT, 'logo-mono.svg'), blockSvg(PALETTES.mono));
fs.writeFileSync(path.join(OUT, 'logo-inverse.svg'), blockSvg(PALETTES.inverse));
fs.writeFileSync(path.join(OUT, 'logo-gold-bg.svg'), blockSvg(PALETTES.gold));
console.log('SVG: ✓ (mark / mono / inverse / gold)');

/* ── الكومبوزيت primary: بلوك + كلمة RAQIB كاملة على حبر داكن ── */
const PRIMARY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160" fill="none">
  <rect width="480" height="160" fill="${INK}"/>
  <g transform="translate(28,42) scale(1.2)">${blockInner(PALETTES.mark)}</g>
  <g transform="translate(118,46.4) scale(1.2)">
    ${lettersInner('#F7F1E3', 11)}
    <rect x="141" y="10" width="44" height="44" rx="12" fill="${TERRA}"/>
    <g stroke="#ffffff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M154 44V20"/><path d="M154 20h7a6 6 0 1 1 0 12h-7"/><path d="M154 32h9.5a6.4 6.4 0 1 1 0 12.5h-9.5"/>
    </g>
  </g>
</svg>`;
fs.writeFileSync(path.join(OUT, 'logo-primary.svg'), PRIMARY_SVG);

/* ── أشِمات PNG من البلوك الأساسي ── */
const blockBuffer = Buffer.from(blockSvg(PALETTES.mark, 512));
const PNG_SIZES = [
  ['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['icon-32.png', 32],
];
for (const [name, size] of PNG_SIZES) {
  await sharp(blockBuffer).resize(size, size).png().toFile(path.join(OUT, name));
}
// أيقونات src/app — تلقائيًا favicon في App Router
const appDir = path.join(process.cwd(), 'src', 'app');
await sharp(blockBuffer).resize(64, 64).png().toFile(path.join(appDir, 'icon.png'));
await sharp(blockBuffer).resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
console.log('PNG: ✓ (512/192/180/32 + app icons)');

/* ── OG 1200×630 — حبر داكن + الكلمة الكاملة + البلوك ── */
const OG_W = 1200, OG_H = 630;
const ogOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" fill="none">
  <defs>
    <radialGradient id="og-glow" cx="0.16" cy="0.24" r="0.9">
      <stop offset="0%" stop-color="${TERRA}" stop-opacity="0.12"/>
      <stop offset="55%" stop-color="${TERRA}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${TERRA}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#og-glow)"/>
  <g transform="translate(70,150) scale(2.5)">
    ${lettersInner('#F7F1E3', 11)}
    <rect x="141" y="10" width="44" height="44" rx="12" fill="${TERRA}"/>
    <g stroke="#ffffff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M154 44V20"/><path d="M154 20h7a6 6 0 1 1 0 12h-7"/><path d="M154 32h9.5a6.4 6.4 0 1 1 0 12.5h-9.5"/>
    </g>
  </g>
  <rect x="70" y="362" width="74" height="6" fill="${TERRA}"/>
  <text x="70" y="450" font-family="Segoe UI, Tahoma, sans-serif" font-weight="600" font-size="44" fill="${TERRA}">منصة الحضور الأكاديمية</text>
  <text x="70" y="508" font-family="Segoe UI, Tahoma, sans-serif" font-weight="400" font-size="29" fill="#938d7c">كلية العلوم · جامعة السويس</text>
  <text x="70" y="560" font-family="Inter, Segoe UI, sans-serif" font-weight="400" font-size="24" fill="#6b6557">raqib-blue.vercel.app</text>
</svg>`.trim();

const base = sharp({
  create: { width: OG_W, height: OG_H, channels: 4, background: { r: 11, g: 14, b: 6, alpha: 1 } },
});
await base.composite([{ input: Buffer.from(ogOverlay) }]).png().toFile(path.join(OUT, 'og-1200x630.png'));
console.log('OG: ✓');

console.log('✅ حزمة الهوية جاهزة في public/brand');
