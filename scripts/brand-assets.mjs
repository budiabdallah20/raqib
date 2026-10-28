/**
 * 🎨 توليد حزمة أصول الهوية — رقيب RAQiB
 * «الختم الأكاديمي»: درع بحدود ذهبية على بلاطة حبر داكنة، بداخله عين مسح
 * بنقطة ذهبية — نفس هندسة src/components/shared/Logo.tsx (64×64).
 * المخرجات: SVG أربع نسخ + PNG باشمات 512/192/180/32 + أيقونات src/app + OG 1200×630.
 *
 * الاستخدام: npm run brand:assets
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'brand');
fs.mkdirSync(OUT, { recursive: true });

/* ── لوحات الألوان (قيم مطابقة لـ Logo.tsx) ── */
const PALETTES = {
  /** الأساسية — ذهب شامبانيا على حبر داكن */
  ink: {
    tile: ['#243020', '#0d1107'],
    stroke: 'rgba(200,162,75,0.30)',
    shieldFill: 'rgba(200,162,75,0.10)',
    guide: '#c8a24b',
    chip: '#f0dfa6',
    iris: ['#f4e6b6', '#d8b45a', '#aa8137'],
    spark: '#f4e6b6',
  },
  /** أحادية كريمية على الحبر — للطباعة والدونات */
  mono: {
    tile: ['#243020', '#0d1107'],
    stroke: 'rgba(247,241,227,0.35)',
    shieldFill: 'rgba(247,241,227,0.08)',
    guide: '#f7f1e3',
    chip: '#f7f1e3',
    iris: ['#f7f1e3', '#e8e1d0', '#cfc7b4'],
    spark: '#ffffff',
  },
  /** معكوسة على خلفيات فاتحة */
  inverse: {
    tile: ['#fffdf5', '#f1e9d3'],
    stroke: 'rgba(136,99,44,0.35)',
    shieldFill: 'rgba(136,99,44,0.07)',
    guide: '#88632c',
    chip: '#88632c',
    iris: ['#f4e6b6', '#d8b45a', '#aa8137'],
    spark: '#f4e6b6',
  },
  /** الختم كاملًا بذهب — لافتات ومواد دعائية */
  gold: {
    tile: ['#f0dfa6', '#c8a24b'],
    stroke: 'rgba(90,66,35,0.45)',
    shieldFill: 'rgba(90,66,35,0.10)',
    guide: '#5a4223',
    chip: '#5a4223',
    iris: ['#fbf6e6', '#f0dfa6', '#c8a24b'],
    spark: '#fbf6e6',
  },
};

/** ختم رقيب — 64×64 بنفس مسارات Logo.tsx (suffix يفرد المعرفات داخل أي مركب) */
function markSvg(palette, suffix = '', size = 64) {
  const p = PALETTES[palette];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="rqb-tile${suffix}" x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.tile[0]}"/>
      <stop offset="1" stop-color="${p.tile[1]}"/>
    </linearGradient>
    <linearGradient id="rqb-iris${suffix}" x1="26" y1="26" x2="40" y2="38" gradientUnits="userSpaceOnUse">
      <stop stop-color="${p.iris[0]}"/>
      <stop offset=".5" stop-color="${p.iris[1]}"/>
      <stop offset="1" stop-color="${p.iris[2]}"/>
    </linearGradient>
    <radialGradient id="rqb-sheen${suffix}" cx="0.5" cy="0" r="1" gradientTransform="translate(32 2) scale(34 26)">
      <stop stop-color="#ffffff" stop-opacity=".14"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect x="1.5" y="1.5" width="61" height="61" rx="20" fill="url(#rqb-tile${suffix})"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="20" fill="url(#rqb-sheen${suffix})"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="20" stroke="${p.stroke}"/>
  <rect x="5" y="5" width="54" height="54" rx="16.5" fill="none" stroke="${p.guide}" stroke-opacity=".38" stroke-width="1" stroke-dasharray="1.5 3.5"/>

  <path d="M32 11.5 50 18.2v14.1c0 10.6-7.5 17.4-18 20.7-10.5-3.3-18-10.1-18-20.7V18.2Z" fill="${p.shieldFill}" stroke="${p.guide}" stroke-width="2.1" stroke-linejoin="round"/>
  <path d="M24.8 21.5h14.4" stroke="${p.guide}" stroke-opacity=".38" stroke-width="1" stroke-linecap="round"/>
  <path d="M23.6 43.8c4.6 2.4 12.2 2.4 16.8 0" stroke="${p.guide}" stroke-opacity=".22" stroke-width="1" stroke-linecap="round"/>

  <path d="M20.6 33.2c3.2-4.4 7-6.6 11.4-6.6s8.2 2.2 11.4 6.6c-3.2 4.4-7 6.6-11.4 6.6s-8.2-2.2-11.4-6.6Z" fill="none" stroke="${p.guide}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="33.2" r="4.35" fill="url(#rqb-iris${suffix})"/>
  <circle cx="30.6" cy="31.9" r="1.05" fill="#fbf6e6" fill-opacity=".9"/>
  <circle cx="32" cy="33.2" r="6.4" fill="none" stroke="${p.chip}" stroke-opacity=".28" stroke-width=".9"/>

  <path d="M47.4 13.4l.62 1.78 1.78.62-1.78.62-.62 1.78-.62-1.78-1.78-.62 1.78-.62Z" fill="${p.spark}" fill-opacity=".92"/>
</svg>`.trim();
}

/* نسخ الهوية */
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), markSvg('ink'));
fs.writeFileSync(path.join(OUT, 'logo-mono.svg'), markSvg('mono'));
fs.writeFileSync(path.join(OUT, 'logo-inverse.svg'), markSvg('inverse'));
fs.writeFileSync(path.join(OUT, 'logo-gold-bg.svg'), markSvg('gold'));
console.log('SVG: ✓ (ink / mono / inverse / gold)');

/* ── الكومبوزيت: primary = الختم + الاسم ── */
const PRIMARY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160" fill="none">
  <rect width="480" height="160" fill="#0b0e06"/>
  <g transform="translate(26,26) scale(1.15)">${markSvg('ink', '-p').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
  <text x="126" y="78" font-family="Cairo, Segoe UI, Tahoma, sans-serif" font-size="52" font-weight="800" fill="#f7f1e3">رقيب</text>
  <text x="126" y="112" font-family="Inter, Segoe UI, sans-serif" font-size="15" font-weight="700" letter-spacing="9" fill="#c8a24b">RAQIB</text>
  <rect x="70" y="132" width="42" height="3.5" fill="#c8a24b"/>
</svg>`;
fs.writeFileSync(path.join(OUT, 'logo-primary.svg'), PRIMARY_SVG);

/* ── أشِمات PNG ── */
const markBuffer = Buffer.from(markSvg('ink', '-png', 512));
const PNG_SIZES = [
  ['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['icon-32.png', 32],
];
for (const [name, size] of PNG_SIZES) {
  await sharp(markBuffer).resize(size, size).png().toFile(path.join(OUT, name));
}
// أيقونات src/app — تلقائيًا favicon في App Router
const appDir = path.join(process.cwd(), 'src', 'app');
await sharp(markBuffer).resize(64, 64).png().toFile(path.join(appDir, 'icon.png'));
await sharp(markBuffer).resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
console.log('PNG: ✓ (512/192/180/32 + app icons)');

/* ── OG 1200×630 — حبر داكن + خلفية ذهبية هادئة + الختم ── */
const OG_W = 1200, OG_H = 630;
const ogOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" fill="none">
  <defs>
    <radialGradient id="og-glow" cx="0.78" cy="0.16" r="0.95">
      <stop offset="0%" stop-color="#c8a24b" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="#c8a24b" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#c8a24b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#og-glow)"/>
  <g transform="translate(${OG_W - 320},64) scale(2.3)">${markSvg('ink', '-og').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
  <path d="M70 52l11 11" stroke="#c8a24b" stroke-opacity=".4" stroke-width="2"/>
  <text x="70" y="316" font-family="Cairo, Segoe UI, Tahoma, sans-serif" font-weight="800" font-size="132" fill="#f7f1e3">رقيب</text>
  <rect x="70" y="344" width="74" height="6" fill="#c8a24b"/>
  <text x="152" y="352" font-family="Inter, Segoe UI, sans-serif" font-weight="700" font-size="24" fill="#c8a24b" letter-spacing="13">RAQIB</text>
  <text x="70" y="442" font-family="Segoe UI, Tahoma, sans-serif" font-weight="600" font-size="52" fill="#d8b45a">منصة الحضور الأكاديمية</text>
  <text x="70" y="508" font-family="Segoe UI, Tahoma, sans-serif" font-weight="400" font-size="33" fill="#938d7c">كلية العلوم · جامعة السويس</text>
  <text x="70" y="566" font-family="Inter, Segoe UI, sans-serif" font-weight="400" font-size="26" fill="#6b6557">raqib-blue.vercel.app</text>
</svg>`.trim();

const base = sharp({
  create: { width: OG_W, height: OG_H, channels: 4, background: { r: 11, g: 14, b: 6, alpha: 1 } },
});
await base.composite([{ input: Buffer.from(ogOverlay) }]).png().toFile(path.join(OUT, 'og-1200x630.png'));
console.log('OG: ✓');

console.log('✅ حزمة الهوية جاهزة في public/brand');
