# رقيب — RAQiB

منصة حضور ومحاضرات لكلية العلوم، جامعة السويس — قسم رياضيات وعلوم الحاسب.

يعمل السيرفر محلياً عبر **HTTPS على المنفذ 5000**.

## التشغيل

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev:https
```

افتح: `https://localhost:5000`

## حسابات تجريبية

| الدور | البريد | كلمة المرور |
| --- | --- | --- |
| أدمن | admin@raqib.edu | Admin@123 |
| دكتور | professor@raqib.edu | Prof@123 |
| طالب | student@raqib.edu | Student@123 |

## الشهادات

الملفات موجودة في `certs/`. إن لزم إعادة توليدها:

```bash
C:\mkcert.exe -install
C:\mkcert.exe -key-file certs/localhost+2-key.pem -cert-file certs/localhost+2.pem localhost 127.0.0.1 ::1
```
