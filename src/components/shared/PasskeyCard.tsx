'use client';

/**
 * بطاقة مفاتيح المرور (Passkey) — تسجّل بصمة/قفل الموبايل على الحساب الحالي،
 * وتعرض المفاتيح المحفوظة مع حالة المزامنة. تُستخدم في الملف الشخصي،
 * فأي مستخدم قديم يقدر يضيف مفتاحًا لموبايله من هنا بلا إعادة تسجيل.
 */
import * as React from 'react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { enrollPasskey, passkeySupported } from '@/lib/passkey-client';

type PasskeyItem = {
  id: string;
  deviceType: string | null;
  backedUp: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

function fmtDate(value: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return null;
  }
}

function hostLabel(item: PasskeyItem) {
  if (item.backedUp) return 'متزامن مع نسخة وسحابي — يعمل على أي جهاز دخلت منه';
  if (item.deviceType === 'singleDevice') return 'مرتبط بهذا الجهاز فقط';
  return 'محفوظ في موبايلك';
}

export function PasskeyCard() {
  const [supported, setSupported] = React.useState(true);
  const [items, setItems] = React.useState<PasskeyItem[] | null>(null);
  const [enrolling, setEnrolling] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    api<{ items: PasskeyItem[] }>('/api/auth/passkey/list')
      .then((data) => setItems(data.items.length > 0 ? data.items : []))
      .catch(() => setItems(null));
  }, []);

  React.useEffect(() => {
    setSupported(passkeySupported());
    load();
  }, [load]);

  async function enroll() {
    setError('');
    setMessage('');
    setEnrolling(true);
    try {
      const result = await enrollPasskey();
      if (result.ok) {
        setMessage('تم إضافة البصمة على حسابك — هي محفوظة الآن داخل موبايلك 🎉');
        load();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <Card className="border-gold-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold-700">
          <Fingerprint className="h-5 w-5" />
          الدخول بالبصمة (Passkey)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-500">
          سجّل بصمة إصبعك أو قفل الوجه — المفتاح يُخزَّن داخل موبيايلك نفسه (لا كلمة سر ولا إيميل)،
          ويعمل بلمسة واحدة. تسجيل الدخول القادم: اضغط «الدخول بالبصمة» وادخل فورًا.
        </p>

        {supported ? (
          <button
            type="button"
            onClick={() => void enroll()}
            disabled={enrolling}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/[0.12] px-5 text-sm font-extrabold text-gold-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Fingerprint className="h-4 w-4" />
            {enrolling ? 'جارٍ التسجيل... ثبّت بصمتك' : 'إضافة بصمة لهذا الموبايل'}
          </button>
        ) : (
          <p className="rounded-xl border border-ink-950/[0.06] bg-ink-500/[0.04] px-4 py-3 text-xs text-ink-500">
            هذا المتصفح لا يدعم مفاتيح المرور — حدّث متصفحك أو استخدم كروم/سفاري على الموبايل.
          </p>
        )}

        {message ? (
          <p className="flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/[0.08] px-4 py-3 text-sm text-brand-700">
            <ShieldCheck className="h-4 w-4" />
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600"
          >
            {error}
          </p>
        ) : null}

        {items && items.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-ink-900">مفاتيحك المحفوظة ({items.length})</p>
            {items.map((item) => {
              const used = fmtDate(item.lastUsedAt) ?? fmtDate(item.createdAt);
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-950/[0.05] bg-white/60 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-ink-900">
                    <Fingerprint className="h-4 w-4 text-gold-700/80" />
                    <code dir="ltr" className="font-latin text-[11px] text-ink-400">
                      {item.id}…
                    </code>
                  </span>
                  <span className="text-[11px] font-semibold text-ink-500">
                    {hostLabel(item)}
                    {used ? ` · آخر استخدام ${used}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
