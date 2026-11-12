'use client';

import * as React from 'react';
import { CheckCircle2, Clock3, RotateCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

type LectureOption = { id: string; title: string; startsAt: string; course: { code: string; name: string } };
type RosterRow = {
  id: string;
  name: string;
  studentCode: string | null;
  group: string | null;
  attendance: { status: string; scannedAt: string } | null;
};
type Roster = {
  lecture: { title: string; cancelled: boolean; isOpen: boolean; course: { code: string; name: string } };
  total: number;
  page: number;
  pageSize: number;
  roster: RosterRow[];
};

export function AttendanceConsole({ admin = false }: { admin?: boolean }) {
  const [lectures, setLectures] = React.useState<LectureOption[]>([]);
  const [lectureId, setLectureId] = React.useState('');
  const [roster, setRoster] = React.useState<Roster | null>(null);
  const [page, setPage] = React.useState(1);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'PRESENT' | 'LATE'>('PRESENT');
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    api<{ lectures: LectureOption[] }>('/api/lectures')
      .then((result) => {
        setLectures(result.lectures);
        setLectureId(result.lectures[0]?.id ?? '');
      })
      .catch((caught) => setError((caught as Error).message));
  }, []);

  const load = React.useCallback(async () => {
    if (!lectureId) return;
    setLoading(true);
    setError('');
    try {
      const result = await api<Roster>(`/api/attendance/reconcile?lectureId=${encodeURIComponent(lectureId)}&page=${page}`);
      setRoster(result);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, [lectureId, page]);

  React.useEffect(() => { void load(); }, [load]);

  async function save(studentId: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ changed: boolean }>('/api/attendance/reconcile', {
        method: 'PATCH', body: JSON.stringify({ lectureId, studentId, status, reason }),
      });
      setMessage(result.changed ? 'تم حفظ التصحيح وإشعار الطالب وتسجيل السبب.' : 'الحالة مسجلة بالفعل؛ لم يتغير السجل.');
      setEditId(null);
      setReason('');
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const pages = roster ? Math.max(1, Math.ceil(roster.total / roster.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gold-700"><ShieldAlert size={16} /> {admin ? 'الرقابة الأكاديمية' : 'التدريس والمتابعة'}</p>
          <h1 className="font-display text-3xl font-extrabold text-ink-950">مركز الحضور</h1>
          <p className="mt-2 text-sm text-ink-500">كشف حي من قاعدة البيانات، مع تصحيح مسبب وسجل تدقيق وإشعار للطالب.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading || busy}><RotateCw size={16} /> تحديث الكشف</Button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800">{message}</p>}

      <label className="mb-5 block text-sm font-bold text-ink-800">
        المحاضرة
        <select
          value={lectureId}
          onChange={(event) => { setLectureId(event.target.value); setPage(1); setRoster(null); setEditId(null); }}
          className="mt-2 h-11 w-full rounded-xl border border-brand-900/15 bg-white/80 px-3 text-sm text-ink-900"
        >
          {lectures.length === 0 && <option value="">لا توجد محاضرات متاحة</option>}
          {lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.course.code} · {lecture.title} · {new Date(lecture.startsAt).toLocaleDateString('ar-EG')}</option>)}
        </select>
      </label>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-900/10 p-4">
            <p className="text-sm font-bold text-ink-900">{roster?.lecture.course.code ?? '—'} · {roster?.lecture.title ?? 'كشف الطلاب'}</p>
            <p className="text-xs text-ink-500">{roster ? `${roster.total} طالب مسجل` : loading ? 'جارٍ التحميل…' : 'اختر محاضرة'}</p>
          </div>
          <div className="divide-y divide-brand-900/10">
            {roster?.roster.map((student) => (
              <div key={student.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{student.name} <span className="font-normal text-ink-500">{student.studentCode ?? ''}</span></p>
                    <p className="mt-1 text-xs text-ink-500">المجموعة {student.group || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${student.attendance?.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-800' : student.attendance?.status === 'LATE' ? 'bg-amber-500/10 text-amber-800' : 'bg-rose-500/10 text-rose-700'}`}>
                      {student.attendance?.status === 'PRESENT' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                      {student.attendance?.status === 'PRESENT' ? 'حاضر' : student.attendance?.status === 'LATE' ? 'متأخر' : student.attendance?.status === 'EXCUSED' ? 'معذور' : 'لا يوجد تسجيل'}
                    </span>
                    <Button variant="outline" disabled={roster.lecture.cancelled || busy} onClick={() => { setEditId(editId === student.id ? null : student.id); setStatus(student.attendance?.status === 'PRESENT' ? 'LATE' : 'PRESENT'); setReason(''); }}>
                      تصحيح
                    </Button>
                  </div>
                </div>
                {editId === student.id && <div className="mt-4 grid gap-3 rounded-xl border border-gold-500/20 bg-gold-500/[0.05] p-4 sm:grid-cols-[150px_1fr_auto] sm:items-end">
                  <label className="text-xs font-bold text-ink-700">الحالة الجديدة
                    <select value={status} onChange={(event) => setStatus(event.target.value as 'PRESENT' | 'LATE')} className="mt-1 h-10 w-full rounded-lg border border-brand-900/15 bg-white px-2 text-sm">
                      <option value="PRESENT">حاضر</option><option value="LATE">متأخر</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-ink-700">سبب التصحيح
                    <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} placeholder="مثال: تم التحقق من الحضور يدويًا بعد عطل الكاميرا" className="mt-1 h-10 w-full rounded-lg border border-brand-900/15 bg-white px-3 text-sm" />
                  </label>
                  <Button disabled={busy || reason.trim().length < 12} onClick={() => void save(student.id)}>{busy ? 'جارٍ الحفظ…' : 'حفظ التصحيح'}</Button>
                </div>}
              </div>
            ))}
            {!loading && roster?.roster.length === 0 && <p className="p-8 text-center text-sm text-ink-500">لا يوجد طلاب مسجلون في هذه المحاضرة.</p>}
          </div>
        </CardContent>
      </Card>

      {pages > 1 && <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <Button variant="outline" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)}>السابق</Button>
        <span>صفحة {page} من {pages}</span>
        <Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>التالي</Button>
      </div>}
    </div>
  );
}
