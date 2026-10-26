/**
 * 🎨 توليد حزمة أصول الهوية — رقيب RAQiB
 * ينبعث لوجو <brand/> 100×100 إلى: PNG بأحجام 512/192/180/32 + OG 1200×630.
 *
 * الاستخدام: npm run brand:assets
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'brand');
fs.mkdirSync(OUT, { recursive: true });

/* ── الشعار الأساسي (نفس هندسة src/components/shared/Logo.tsx) ── */
const MARK_SVG = ({ bg = '#0A0A0C', border = '#3a3830', r = '#F7F1E3', gold = '#FFD700' } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
  <rect x="1" y="1" width="98" height="98" rx="27" fill="${bg}"/>
  <rect x="2.2" y="2.2" width="95.6" height="95.6" rx="25.8" stroke="${border}" stroke-opacity="0.35" stroke-width="1.4"/>
  <path d="M33 25v50" stroke="${r}" stroke-width="13.5" stroke-linecap="butt"/>
  <path d="M33 25h23c13.6 0 24.6 9.4 24.6 20.8S69.6 66.6 56 66.6H33" stroke="${r}" stroke-width="13.5" stroke-linejoin="round" stroke-linecap="butt"/>
  <circle cx="62" cy="45.8" r="4.9" fill="${gold}"/>
  <path d="M54.5 63.5 80 84" stroke="${gold}" stroke-width="13.5" stroke-linecap="round"/>
</svg>`;

/* نسخ حسب الهوية */
const VARIANTS = {
  'logo-mark':     MARK_SVG(),                                     /** الأساسية — خلفية داكنة */
  'logo-mono':     MARK_SVG({ gold: '#F7F1E3', border: '#F7F1E3' }), /** أحادية كريم smoke */
  'logo-inverse':  MARK_SVG({ bg: '#F7F1E3', border: '#d8d0bd', r: '#0A0A0C', gold: '#C2930F' }), /** معكوسة على فاتح */
  'logo-gold-bg':  MARK_SVG({ bg: '#E8B923', border: '#c2930f', r: '#0A0A0C', gold: '#0A0A0C' }), /** على ذهبي */
};

/* الأصول الكتابية (الأصلية مكتوبة يدويًا في  public/brand/svg) */
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), VARIANTS['logo-mark']);
fs.writeFileSync(path.join(OUT, 'logo-mono.svg'), VARIANTS['logo-mono']);
fs.writeFileSync(path.join(OUT, 'logo-inverse.svg'), VARIANTS['logo-inverse']);
console.log('SVG: ✓');

/* ── الكومبوزيت: primary = mark + حرفية RAQiB ── */
const PRIMARY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160" fill="none">
  <rect width="480" height="160" fill="#0A0A0C"/>
  <g transform="translate(30,30) scale(1.0)">
    <rect x="1" y="1" width="98" height="98" rx="27" fill="#0A0A0C"/>
    <rect x="2.2" y="2.2" width="95.6" height="95.6" rx="25.8" stroke="#3a3830" stroke-opacity=".5" stroke-width="1.4"/>
    <path d="M33 25v50" stroke="#F7F1E3" stroke-width="13.5"/>
    <path d="M33 25h23c13.6 0 24.6 9.4 24.6 20.8S69.6 66.6 56 66.6H33" stroke="#F7F1E3" stroke-width="13.5" stroke-linejoin="round"/>
    <circle cx="62" cy="45.8" r="4.9" fill="#FFD700"/>
    <path d="M54.5 63.5 80 84" stroke="#FFD700" stroke-width="13.5" stroke-linecap="round"/>
  </g>
  <text x="160" y="95" font-family="Inter, Segoe UI, sans-serif" font-weight="800" font-size="56" fill="#F7F1E3" letter-spacing="10">RAQiB</text>
  <text x="386" y="76" font-family="Inter, Segoe UI, sans-serif" font-weight="900" font-size="20" fill="#FFD700">.</text>
</svg>`;
fs.writeFileSync(path.join(OUT, 'logo-primary.svg'), PRIMARY_SVG);

/* ── أحجام PNG ── */
const markBuffer = Buffer.from(VARIANTS['logo-mark']);
const PNG_SIZES = [
  ['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180], ['icon-32.png', 32],
];
for (const [name, size] of PNG_SIZES) {
  await sharp(markBuffer, { density: 400 }).resize(size, size).png().toFile(path.join(OUT, name));
}
// نسخة app/ لتوثيقها كـ favicon تلقائي في App Router
const appDir = path.join(process.cwd(), 'src', 'app');
await sharp(markBuffer, { density: 400 }).resize(32, 32).png().toFile(path.join(appDir, 'icon.png'));
await sharp(markBuffer, { density: 400 }).resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
console.log('PNG: ✓ (512/192/180/32)');

/* ── OG 1200×630 — صورة فعلية (PNG) بحقل ذهبي + شعار ── */
const OG_W = 1200, OG_H = 630;
const ogOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" fill="none">
  <defs>
    <radialGradient id="glow" cx="0.75" cy="0.2" r="0.9">
      <stop offset="0%" stop-color="#FFD700" stop-opacity="0.14"/>
      <stop offset="60%" stop-color="#FFD700" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#FFD700" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#glow)"/>
  <g transform="translate(${OG_W - 320},70) scale(2.1)">
    <rect x="1" y="1" width="98" height="98" rx="27" fill="#0A0A0C" stroke="#3a3830" stroke-width="1"/>
    <path d="M33 25v50" stroke="#F7F1E3" stroke-width="13.5"/>
    <path d="M33 25h23c13.6 0 24.6 9.4 24.6 20.8S69.6 66.6 56 66.6H33" stroke="#F7F1E3" stroke-width="13.5" stroke-linejoin="round"/>
    <circle cx="62" cy="45.8" r="4.9" fill="#FFD700"/>
    <path d="M54.5 63.5 80 84" stroke="#FFD700" stroke-width="13.5" stroke-linecap="round"/>
  </g>
  <text x="70" y="330" font-family="Segoe UI, Tahoma, sans-serif" font-weight="800" font-size="120" fill="#F7F1E3">RAQiB</text>
  <rect x="70" y="360" width="64" height="6" fill="#FFD700"/>
  <text x="70" y="440" font-family="Segoe UI, Tahoma, sans-serif" font-weight="600" font-size="54" fill="#f8c64b">منصة الحضور الأكاديمي</text>
  <text x="70" y="510" font-family="Segoe UI, Tahoma, sans-serif" font-weight="400" font-size="34" fill="#8f887b">كلية العلوم · جامعة السويس</text>
  <text x="70" y="570" font-family="Segoe UI, Tahoma, sans-serif" font-weight="400" font-size="28" fill="#5f594d">raqib.app</text>
</svg>`;

const base = sharp({
  create: { width: OG_W, height: OG_H, channels: 4, background: { r: 10, g: 10, b: 12, alpha: 1 } },
});
await base.composite([{ input: Buffer.from(ogOverlay) }]).png().toFile(path.join(OUT, 'og-1200x630.png'));
console.log('OG: ✓');

console.log('✅ حزمة الهوية جاهزة في public/brand');
