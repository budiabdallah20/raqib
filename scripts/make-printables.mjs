import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const ROOT = process.cwd();
const OUT = join(ROOT, 'public', 'printables');
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:5000').replace(/\/$/, '');

const ink = '#0A0A0C';
const gold = '#FFD700';
const cream = '#F6F1E7';

function shell({ title, subtitle, body, note }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Cairo','Segoe UI',sans-serif; background: #e8e4da; }
  .sheet { width: 210mm; min-height: 297mm; margin: 8mm auto; background: ${cream}; padding: 14mm; position: relative; overflow: hidden; border: 1px solid #d8d2c4; }
  .accent { position:absolute; top:0; right:0; left:0; height: 10mm; background: linear-gradient(90deg, ${gold}, #E8B923); }
  .chamfer { position:absolute; top:16mm; left:10mm; width:22mm; height:22mm; background:${ink}; border-radius:6mm; clip-path: polygon(35% 0, 100% 0, 100% 65%, 65% 100%, 0 100%, 0 35%); display:flex; align-items:center; justify-content:center; color:${gold}; font-weight:900; font-size:9mm; }
  h1 { color:${ink}; font-size: 13mm; font-weight: 900; margin-top: 6mm; }
  h2 { color:${ink}; font-size: 7mm; margin-top: 3mm; font-weight: 700; }
  .qrbox { margin: 10mm auto; width: 96mm; height: 96mm; background:#fff; border: 3px solid ${ink}; border-radius: 8mm; display:flex; align-items:center; justify-content:center; }
  .qrbox img { width: 84mm; height: 84mm; }
  .code { text-align:center; font-size: 9mm; font-weight: 900; letter-spacing: 3mm; color:${ink}; border: 2.5px dashed ${ink}; border-radius: 6mm; padding: 4mm 8mm; width: fit-content; margin: 6mm auto; }
  .steps { margin: 8mm auto 0; width: 150mm; }
  .steps li { font-size: 5.2mm; color:#3a3630; margin-bottom: 3.5mm; line-height: 1.5; }
  .b { display:inline-block; background:${ink}; color:#fff; border-radius: 3mm; padding: 0 3mm; font-weight:700; }
  .footer { position:absolute; bottom: 10mm; right: 14mm; left: 14mm; display:flex; justify-content:space-between; align-items:center; font-size: 4.2mm; color:#7a7466; border-top: 1px dashed #c9c2b2; padding-top: 4mm; }
  .demo { background:#E8AE2E; color:${ink}; font-weight:800; border-radius: 3mm; padding: 1mm 4mm; font-size: 4.2mm; }
  .url { direction:ltr; font-family: monospace; color:#3a3630; font-size: 4.6mm; }
  @media print { body { background:#fff; } .sheet { margin:0; border:none; } }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
<div class="sheet">
  <div class="accent"></div>
  <div class="chamfer">ر9</div>
  <h1>${title}</h1>
  <h2>${subtitle}</h2>
  ${body}
  <div class="footer">
    <span>رقيب RAQiB — كلية العلوم · جامعة السويس</span>
    <span class="demo">وضع تجريبي DEMO</span>
    <span class="url">${APP_URL}</span>
  </div>
</div>
</body>
</html>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const lectures = await prisma.lecture.findMany({
    where: { isOpen: true },
    include: { course: true, professor: true },
    take: 3,
  });
  if (lectures.length === 0) throw new Error('لا توجد محاضرات حية — شغّل npm run seed:demo');
  const scanUrl = `${APP_URL}/student`;

  const steps = `
  <ol class="steps">
    <li><span class="b">١</span> افتح <span class="url">${APP_URL}</span> وسجّل بحسابك الجامعي.</li>
    <li><span class="b">٢</span> من «تسجيل حضور» وجّه كاميرا هاتفك إلى رمز الشاشة الكبيرة عند الدكتور.</li>
    <li><span class="b">٣</span> الكاميرا مش شغالة؟ أدخِل <b>كود اليوم الظاهر بالأسفل</b> يدويًا.</li>
    <li><span class="b">٤</span> سجلك يُحفظ فورًا مع IP وجهازك في دفتر تدقيق رسمي.</li>
  </ol>`;

  let n = 0;
  for (const lec of lectures) {
    n += 1;
    const png = await QRCode.toDataURL(scanUrl, { margin: 1, width: 760, errorCorrectionLevel: 'M' });
    const html = shell({
      title: 'سجّل حضورك الآن',
      subtitle: `${lec.course.code} — ${lec.course.name}${lec.group ? ` · شعبة ${lec.group}` : ''}${lec.location ? ` · ${lec.location}` : ''}`,
      body: `
  <div class="qrbox"><img src="${png}" alt="QR تسجيل الحضور" /></div>
  <p style="text-align:center; font-size:5mm; color:#7a7466; margin-top:-6mm;">امسح للوصول لصفحة حضور رقيب</p>
  <p class="code">كود اليوم يظهر على شاشة الدكتور</p>
  ${steps}
  <p style="text-align:center; font-size:4.6mm; color:#7a7466; margin-top:6mm;">درس النهارده: ${lec.title} — الدكتور: ${lec.professor.name}</p>`,
      note: `poster-${n}`,
    });
    const file = join(OUT, `poster-${n}-${lec.course.code.toLowerCase()}.html`);
    writeFileSync(file, html, 'utf8');
    console.log('✔', file);
  }

  // كارت الطالب التجريبي
  const cardPng = await QRCode.toDataURL(
    `BEGIN:VCARD\nVERSION:3.0\nFN:طالب تجريبي\nORG:كلية العلوم — جامعة السويس\nNOTE:رقيب RAQiB · بطاقة تجريبية\nEND:VCARD`,
    { margin: 1, width: 500 },
  );
  const card = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>كارت طالب تجريبي — رقيب</title>
<style>
*{box-sizing:border-box;margin:0} body{font-family:'Cairo',sans-serif;background:#e8e4da;display:flex;gap:8mm;justify-content:center;padding:10mm;flex-wrap:wrap}
.card{width:86mm;height:54mm;background:${ink};border-radius:6mm;color:${cream};position:relative;padding:6mm;overflow:hidden}
.card::before{content:'';position:absolute;top:0;right:0;left:0;height:5mm;background:linear-gradient(90deg,${gold},#E8B923)}
.cham{position:absolute;top:9mm;left:6mm;width:11mm;height:11mm;background:${gold};border-radius:3mm;clip-path:polygon(35% 0,100% 0,100% 65%,65% 100%,0 100%,0 35%);display:flex;align-items:center;justify-content:center;color:${ink};font-weight:900;font-size:4.5mm}
.nm{font-size:6mm;font-weight:900;margin-top:7mm} .mt{font-size:3.6mm;color:#bdb6a4;margin-top:1mm}
.row{display:flex;gap:4mm;margin-top:3.5mm;font-size:4.2mm} .row b{color:${gold}}
img{position:absolute;bottom:4mm;left:5mm;width:16mm;height:16mm;background:#fff;border-radius:2mm;padding:1mm}
.tag{position:absolute;bottom:5mm;right:6mm;background:#E8AE2E;color:${ink};font-weight:800;border-radius:2mm;padding:0.8mm 2.6mm;font-size:3.4mm}
@media print{body{background:#fff;padding:0}} @page{size:A4;margin:0}
</style></head><body>
<div class="card"><div class="cham">ر9</div>
<div class="nm">محمد طالب تجريبي</div><div class="mt">كلية العلوم · الكود 2024-001</div>
<div class="row"><span>شعبة: <b>A</b></span><span>المستوى: <b>2</b></span><span>البرنامج: <b>رقيب</b></span></div>
<img src="${cardPng}" alt="QR"><div class="tag">بيانات تجريبية</div></div>
</body></html>`;
  const cardFile = join(OUT, 'student-card-demo.html');
  writeFileSync(cardFile, card, 'utf8');
  console.log('✔', cardFile);
  console.log(`تم توليد ${n} بوسترات + كارت طالب في public/printables`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
