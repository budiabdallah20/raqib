'use client';

import * as React from 'react';
import { ShieldCheck, MonitorSmartphone, RefreshCw, XCircle } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

type SessionRow = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export default function SessionsPage() {
  const [sessions, setSessions] = React.useState<SessionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api<{ sessions: SessionRow[] }>('/api/auth/sessions');
      setSessions(result.sessions);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function revoke(sessionId?: string) {
    const question = sessionId ? 'إغلاق هذه الجلسة على الجهاز الآخر؟' : 'إغلاق كل الجلسات الأخرى؟';
    if (!window.confirm(question)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ revoked: number }>('/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify(sessionId ? { sessionId } : { allOther: true }),
      });
      setMessage(`أُغلقت ${result.revoked} جلسة. سيُطلب تسجيل الدخول مجددًا على الأجهزة المتأثرة.`);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const otherCount = sessions.filter((session) => !session.current).length;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gold-700"><ShieldCheck size={16} /> أمان الحساب</p>
            <h1 className="font-display text-3xl font-extrabold text-ink-950">جلساتي وأجهزتي</h1>
            <p className="mt-2 text-sm text-ink-500">كل جلسة محفوظة في قاعدة البيانات ويمكن إبطالها فورًا.</p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading || busy}>
            <RefreshCw size={16} /> تحديث
          </Button>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800">{message}</p>}

        <div className="grid gap-3">
          {loading ? <p className="py-8 text-center text-ink-500">جارٍ تحميل الجلسات…</p> : sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-xl border border-gold-500/20 bg-gold-500/10 p-2 text-gold-700"><MonitorSmartphone size={20} /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-900">{session.current ? 'هذا الجهاز · الجلسة الحالية' : 'جهاز آخر'}</p>
                    <p className="mt-1 max-w-xl break-words text-xs text-ink-500">{session.userAgent || 'متصفح غير معروف'}</p>
                    <p className="mt-1 text-xs text-ink-400">آخر نشاط: {dateTime(session.lastSeenAt)} · تنتهي: {dateTime(session.expiresAt)}</p>
                  </div>
                </div>
                {!session.current && <Button variant="outline" disabled={busy} onClick={() => void revoke(session.id)}><XCircle size={16} /> إغلاق الجلسة</Button>}
              </CardContent>
            </Card>
          ))}
          {!loading && sessions.length === 0 && <p className="py-8 text-center text-ink-500">لا توجد جلسات نشطة.</p>}
        </div>
        {otherCount > 1 && <Button className="mt-5" variant="outline" disabled={busy} onClick={() => void revoke()}>إغلاق كل الأجهزة الأخرى</Button>}
      </div>
    </DashboardShell>
  );
}
