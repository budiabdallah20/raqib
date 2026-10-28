'use client';

/**
 * 🪧 لوحة عرض المحاضرة — خلفية full-screen للدكتور
 * رمز QR تنشأ تلقائيًا متدور كل 20 ثانية + عدّاد شمال + حالة لحظية + كود يدوي.
 */
import * as React from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, Users, Zap, KeyRound, Clock } from 'lucide-react';

type Board = {
  closed: boolean;
  lecture: {
    id: string;
    title: string;
    location: string | null;
    startsAt: string | Date;
    course: { name: string; code: string };
  };
  token?: string;
  expiresAt?: string;
  manualCode?: string;
  attendees?: number;
  present?: number;
  late?: number;
  expected?: number;
  recent?: { name: string; code: string | null; group: string | null; status: string; at: string }[];
};

const ROTATE_MS = 20_000;

export default function ProfessorBoardPage() {
  // لا نقرأ window أثناء الرسم — الصفحة تُبنى على السيرفر أولًا
  const [lectureId, setLectureId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLectureId(params.get('lectureId') || '');
  }, []);

  const [board, setBoard] = React.useState<Board | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [qrData, setQrData] = React.useState<string>("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
  const [seconds, setSeconds] = React.useState(ROTATE_MS / 1000);

  /* التدوير: كل ثانية عدّاد + عند الصفر نجيب التوكِن الجديد */
  React.useEffect(() => {
    if (!lectureId) return;
    let alive = true;
    const id = lectureId; // تضييق النوع داخل الإغلاق async

    async function load() {
      try {
        const data = await api<Board>(`/api/lectures/board?lectureId=${encodeURIComponent(id)}`);
        if (!alive) return;
        setBoard(data);
        setErr(null);
        if (!data.closed && data.token) {
          // تحميل qrcode عند الحاجة فقط — لا يُنفَّذ على السيرفر أثناء البناء
          const { default: QRCode } = await import('qrcode');
          setQrData(await QRCode.toDataURL(`${window.location.origin}/student?token=${data.token}`, {
            width: 1024,
            margin: 1,
            color: { dark: '#0f1117', light: '#F7F1E3' },
          }));
          setSeconds(ROTATE_MS / 1000);
        }
      } catch (e) {
        setErr((e as Error).message);
      }
    }

    load();
    const poll = setInterval(load, 7_000);
    return () => { alive = false; clearInterval(poll); };
  }, [lectureId]);

  React.useEffect(() => {
    const idle = board?.closed || !board?.token;
    if (idle) return;
    const tick = setInterval(() => {
      setSeconds((s) => (s <= 1 ? ROTATE_MS / 1000 + 7 : s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [board?.closed, board?.token]);

  // أثناء القراءة الأولى من المتصفح
  if (lectureId === null) {
    return <div className="min-h-screen bg-[#0A0A0C]" />;
  }

  if (!lectureId) {
    return (
      <div className="min-h-screen bg-grid text-ink-900 flex items-center justify-center flex-col gap-3">
        <p className="text-lg font-semibold">رابط غير صالح — افتح اللوحة من داشبوردك.</p>
        <a href="/professor" className="text-gold hover:underline">← رجوع للوحة</a>
      </div>
    );
  }

  const pct = board?.expected ? Math.round(((board?.attendees ?? 0) / board.expected) * 100) : 0;
  const ring = `conic-gradient(#FFD700 ${Math.max(0, Math.min(100, (1 - seconds / (ROTATE_MS / 1000 + 7))) * 100)}%, transparent 0)`;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-ink-900" dir="rtl">
      <div className="pointer-events-none absolute inset-0 bg-radial-brand" />
      <div className="relative">
        {/* شريط علوي رفيع */}
        <header className="flex items-center justify-between gap-4 border-b border-brand-900/[0.08] px-6 py-4">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold">
              {board?.lecture.course.code} — {board?.lecture.title}
            </p>
            <p className="text-xs text-ink-400">{board?.lecture.location} · {board?.lecture.course.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-gold-500/25 bg-gold-500/[0.08] px-3 py-1.5 text-xs text-gold-700">
              {err ? 'إعادة المحاولة…' : 'محاضرة مفتوحة'}
            </span>
            <a href="/professor" aria-label="رجوع"
               className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-900/10 bg-white/60 text-ink-500 transition hover:text-gold">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </div>
        </header>

        {board?.closed ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-3xl font-extrabold text-ink-700">المحاضرة مغلقة</p>
            <p className="text-ink-400">افتح المحاضرة من لوحتك ثم عد إلى هنا.</p>
            <a href="/professor" className="rounded-xl border border-gold-500/25 bg-gold-500/[0.08] px-5 py-2.5 text-gold-700">← رجوع للوحة</a>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center">
            {/* QR عملاق + عدّاد التدوير */}
            <div className="mx-auto flex flex-col items-center gap-5">
              <div className="relative rounded-[2rem] bg-sand p-5 shadow-[0_0_120px_-20px_rgba(255,215,0,0.35)]">
                <img src={qrData} alt="رمز الحضور" className="h-[min(64vh,460px)] w-[min(64vh,460px)]" />
              </div>
              {/* عدّاد دائري حوالي 20 ثانية */}
              <div className="flex items-center gap-3">
                <span aria-hidden className="relative h-10 w-10 rounded-full border border-gold-500/20"
                      style={{ backgroundImage: ring }}>
                  <span className="absolute inset-1 rounded-full bg-[#0A0A0C]" />
                </span>
                <p className="text-sm text-ink-500">رمز جديد كل <b className="text-gold-700">20</b> ثانية</p>
              </div>
            </div>

            {/* جانب الأرقام */}
            <div className="min-w-0 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gold-500/20 bg-gold-500/[0.06] p-5">
                  <p className="text-xs text-ink-400">حاضرون الآن</p>
                  <p className="font-display text-5xl font-extrabold text-gold-700">{board?.attendees ?? 0}</p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    من {board?.expected ?? 0} مسجل · {pct}%
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-500/15 bg-brand-500/[0.05] p-5">
                  <p className="text-xs text-ink-400">تم في الموعد</p>
                  <p className="font-display text-4xl font-extrabold text-brand-700">{board?.present ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-5">
                  <p className="text-xs text-ink-400">متأخرون</p>
                  <p className="font-display text-4xl font-extrabold text-amber-300">{board?.late ?? 0}</p>
                </div>
              </div>

              {/* البديل اليدوي 6 أرقام */}
              <div className="rounded-2xl border border-gold-500/15 bg-white/65 p-5">
                <div className="flex items-center gap-2 text-ink-500">
                  <KeyRound className="h-4 w-4" />
                  <p className="text-xs">بديل يدوي — للطلاب كارثة الكاميرا</p>
                </div>
                <p className="mt-2 font-display text-6xl font-extrabold tracking-[0.3em] text-ink-900" dir="ltr">
                  {board?.manualCode ?? '------'}
                </p>
              </div>

              {/* آخر 5 مسحات */}
              <div className="rounded-2xl border border-brand-900/10 bg-white/65 p-5">
                <div className="mb-3 flex items-center gap-2 text-ink-500">
                  <Zap className="h-4 w-4" />
                  <p className="text-xs">آخر المسحات</p>
                </div>
                <ul className="space-y-2.5">
                  {(board?.recent ?? []).length === 0 && (
                    <li className="text-sm text-ink-300">لا يوجد مسحات بعد…</li>
                  )}
                  {(board?.recent ?? []).map((r, i) => (
                    <li key={`${r.code}-${i}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {r.name} <span className="text-ink-400">· {r.code}</span>
                        </p>
                        <p className="text-[10.5px] text-ink-400">
                          جروب {r.group || '—'} · {new Date(r.at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${r.status === 'PRESENT' ? 'bg-brand-500/15 text-brand-700' : 'bg-amber-500/15 text-amber-300'}`}>
                        {r.status === 'PRESENT' ? 'حاضر' : 'متأخر'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
