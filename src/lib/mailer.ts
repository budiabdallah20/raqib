import { APP_NAME, APP_NAME_EN } from './constants';

type MailResult = { delivered: boolean; reason?: string };

function resetEmailHtml(name: string, code: string) {
  return `
  <div dir="rtl" style="background:#07060a;padding:40px 18px;font-family:Tahoma,Arial,sans-serif;color:#f7f1e3">
    <div style="max-width:520px;margin:0 auto;background:linear-gradient(160deg,#121016,#0b0a0e);border:1px solid rgba(232,174,46,.28);border-radius:24px;overflow:hidden">
      <div style="padding:28px 30px 10px;text-align:center">
        <div style="display:inline-block;padding:8px 16px;border:1px solid rgba(232,174,46,.35);border-radius:999px;color:#f8c64b;font-size:12px;letter-spacing:3px">${APP_NAME_EN}</div>
      </div>
      <div style="padding:10px 30px 34px;text-align:center">
        <h1 style="margin:18px 0 10px;font-size:24px;color:#fff">أهلًا ${name || 'بك'} 👋</h1>
        <p style="margin:0 0 22px;color:#b9b2a4;font-size:14px;line-height:1.9">
          وصلنا طلب لإعادة تعيين كلمة المرور على ${APP_NAME}. استخدم الكود التالي خلال 10 دقائق.
        </p>
        <div style="margin:0 auto 22px;max-width:280px;padding:18px;border-radius:18px;background:rgba(232,174,46,.09);border:1px solid rgba(232,174,46,.3);letter-spacing:10px;font-size:30px;font-weight:bold;color:#f8c64b">
          ${code}
        </div>
        <p style="margin:0;color:#7f7869;font-size:12px;line-height:1.9">
          إذا لم تطلب هذا التغيير، تجاهل الرسالة ولن يحدث أي شيء.<br/>
          لا تشارك هذا الكود مع أي شخص.
        </p>
      </div>
      <div style="padding:16px;border-top:1px solid rgba(255,255,255,.06);text-align:center;color:#5f594d;font-size:11px">
        ${APP_NAME} · منصة الحضور الذكية — جامعة السويس
      </div>
    </div>
  </div>`;
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  name: string,
): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[RAQIB MAIL] ${new Date().toISOString()} → ${email}\n[RAQIB MAIL] Password reset code: ${code} (valid 10 minutes)\n`,
    );
    return { delivered: false, reason: 'RESEND_API_KEY is not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Raqib <no-reply@raqib.app>',
        to: [email],
        subject: `كود إعادة تعيين كلمة المرور — ${APP_NAME}`,
        html: resetEmailHtml(name, code),
        text: `كود إعادة تعيين كلمة المرور في ${APP_NAME}: ${code}\nصالح لمدة 10 دقائق.`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[RAQIB MAIL] Resend error:', response.status, detail);
      return { delivered: false, reason: 'mail provider rejected the request' };
    }
    return { delivered: true };
  } catch (error) {
    console.error('[RAQIB MAIL] Failed to send:', error);
    return { delivered: false, reason: 'mail provider is unreachable' };
  }
}

export function generateResetCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, '0');
}
