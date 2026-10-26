import { prisma } from './db';
import { APP_NAME } from './constants';

/**
 * 🔔 إشعارات المنصة — داخل التطبيق (دائمًا) + بريد Resend لو المتغير موجود.
 * fallback: طباعة الكود في الكونسول بلا أي فشل للطلب.
 */
export type NotifyKind = 'INFO' | 'LECTURE' | 'ALERT' | 'TASK';

type NotifyInput = {
  userIds: string[];
  title: string;
  body?: string;
  kind?: NotifyKind;
  link?: string;
  email?: boolean; // يرسل بريد مع كل إشعار (استخدمه بحذر)
};

export async function notifyUsers({
  userIds,
  title,
  body,
  kind = 'INFO',
  link,
  email = false,
}: NotifyInput) {
  if (userIds.length === 0) return { created: 0 };

  // إشعارات داخل التطبيق
  const created = await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, body, kind, link })),
  });

  // بريد (اختياري)
  if (email) {
    const recipients = await prisma.user.findMany({
      where: { id: { in: userIds }, email: { not: null }, isActive: true },
      select: { email: true },
    });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`\n[RAQIB NOTIFY] (${kind}) no RESEND_API_KEY — fallback to console: "${title}" ×${recipients.length}`);
    } else {
      for (const r of recipients) {
        if (!r.email) continue;
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.MAIL_FROM || `Raqib <no-reply@raqib.app>`,
            to: [r.email],
            subject: `${title} — ${APP_NAME}`,
            html: noticeEmailHtml(title, body),
          }),
        }).catch(() => {});
      }
    }
  }

  return { created: created.count };
}

function noticeEmailHtml(title: string, body?: string) {
  return `
  <div dir="rtl" style="background:#07060a;padding:36px 18px;font-family:Tahoma,Arial,sans-serif;color:#f7f1e3">
    <div style="max-width:520px;margin:0 auto;background:linear-gradient(160deg,#121016,#0b0a0e);border:1px solid rgba(232,174,46,.28);border-radius:22px;overflow:hidden">
      <div style="padding:26px 30px;text-align:center">
        <h1 style="margin:0 0 12px;font-size:21px;color:#fff">${title}</h1>
        <p style="margin:0;color:#b9b2a4;font-size:14px;line-height:1.9;white-space:pre-line">${body || ''}</p>
        <p style="margin-top:22px;color:#f8c64b;font-size:12px;letter-spacing:2px">رقيب · منصة الحضور الذكية</p>
      </div>
    </div>
  </div>`;
}
