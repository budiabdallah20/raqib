'use client';

/**
 * 📝 مذكرة الملاحظات — صناديق قابلة للربط بالمواد، تثبيت، بحث، تصدير TXT.
 * الخدمة نفسها (StudentNote) موجودة أصلًا — هنا أول واجهة ليها.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/components/student/PortalAgent';
import { EmptyState } from '@/components/student/EmptyState';
import { RowsSkeleton } from '@/components/student/Skeletons';
import { downloadBlob } from '@/lib/exporters';
import { cn } from '@/lib/utils';

type Note = {
  id: string;
  title: string | null;
  body: string;
  pinned: boolean;
  courseId: string | null;
  course: { code: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

type CourseRef = { id: string; code: string; name: string };

export default function StudentNotesPage() {
  const [notes, setNotes] = React.useState<Note[] | null>(null);
  const [courses, setCourses] = React.useState<CourseRef[]>([]);
  const [query, setQuery] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('ALL');
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  // صندوقة الصياغة
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [linkCourse, setLinkCourse] = React.useState('');
  const [pinned, setPinned] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [composerError, setComposerError] = React.useState('');

  const load = React.useCallback(() => {
    return api<{ notes: Note[] }>('/api/student/notes')
      .then((data) => setNotes(data.notes ?? []))
      .catch((err) => {
        toast((err as Error).message);
        setNotes([]);
      });
  }, []);

  React.useEffect(() => {
    void load();
    // سنة المواد المتاحة للربط — من تحليلات الحضور (فيها كود/اسم/معرف)
    api<{ summary: { course: CourseRef }[] }>('/api/attendance/summary')
      .then((data) => setCourses(data.summary.map((row) => row.course)))
      .catch(() => []);
  }, [load]);

  const resetComposer = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setLinkCourse('');
    setPinned(false);
    setComposerError('');
  };

  const openEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title ?? '');
    setBody(note.body);
    setLinkCourse(note.courseId ?? '');
    setPinned(note.pinned);
    setComposerError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (body.trim().length < 2) {
      setComposerError('اكتب على الأقل كلمتين في الملاحظة');
      return;
    }
    setBusy(true);
    setComposerError('');
    const payload = {
      title: title.trim() || '',
      body: body.trim(),
      courseId: linkCourse || '',
      pinned,
    };
    try {
      if (editingId) {
        await api('/api/student/notes', { method: 'PATCH', body: JSON.stringify({ id: editingId, ...payload }) });
        toast('الملاحظة اتحدثت ✏️');
      } else {
        await api('/api/student/notes', { method: 'POST', body: JSON.stringify(payload) });
        toast('الملاحظة اتسجلت ✅');
      }
      resetComposer();
      await load();
    } catch (err) {
      setComposerError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      window.setTimeout(() => setConfirmDelete((current) => (current === id ? null : current)), 3200);
      return;
    }
    setConfirmDelete(null);
    try {
      await api(`/api/student/notes?id=${id}`, { method: 'DELETE' });
      toast('الملاحظة اتشالت');
      await load();
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      await api('/api/student/notes', { method: 'PATCH', body: JSON.stringify({ id: note.id, pinned: !note.pinned }) });
      await load();
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const exportTxt = () => {
    if (!notes?.length) return;
    const lines: string[] = [
      'RAQiB — رقيب · مذكرة ملاحظاتي',
      `تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}`,
      '────────────────────────────',
      '',
    ];
    for (const note of notes) {
      lines.push(`📌 ${note.title || 'ملاحظة'}${note.course ? ` (${note.course.code} — ${note.course.name})` : ''}`);
      lines.push(note.body);
      lines.push(`— ${new Date(note.updatedAt).toLocaleString('ar-EG')}`);
      lines.push('');
    }
    downloadBlob('raqib-notes.txt', 'text/plain;charset=utf-8', lines.join('\n'));
    toast('نزّلت مذكرتك TXT 📄');
  };

  const normal = (text: string) =>
    text.toLowerCase().replace(/[\u064B-\u0652\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

  const shown = (notes ?? []).filter((note) => {
    if (courseFilter !== 'ALL' && note.courseId !== courseFilter) return false;
    if (!query.trim()) return true;
    return normal(`${note.title ?? ''} ${note.body} ${note.course?.name ?? ''}`).includes(normal(query.trim()));
  });

  const pinnedCount = (notes ?? []).filter((note) => note.pinned).length;

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">مذكرة الملاحظات</h1>
          <p className="mt-1 text-ink-500">ذاكرتك الشخصية — موصولة بمقرراتك ومحفوظة في حسابك</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand-900/10 bg-white/65 px-3 py-1.5 text-xs font-bold text-ink-600" dir="ltr">
            {notes?.length ?? 0} ملاحظة · {pinnedCount} مثبتة
          </span>
          <Button variant="outline" onClick={exportTxt} disabled={!notes?.length}>
            <Download className="h-4 w-4" />
            تصدير TXT
          </Button>
        </div>
      </div>

      {/* الصندوقة */}
      <Card className="mb-6 border-gold-400/25 shadow-gold-soft">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Pencil className="h-4 w-4 text-gold-700" /> : <Plus className="h-4 w-4 text-gold-700" />}
            {editingId ? 'تعديل ملاحظة' : 'ملاحظة جديدة'}
          </CardTitle>
          {editingId ? (
            <Button size="sm" variant="ghost" onClick={resetComposer}>
              <X className="h-3.5 w-3.5" />
              إلغاء التعديل
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="عنوان اختياري — مثب: سؤال ميدترم مهم"
            maxLength={120}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="اكتب ملاحظتك… (موضوع، فكرة، نقطة من شرح الدكتور)"
            rows={4}
            maxLength={4000}
            className="w-full resize-y rounded-xl border border-brand-900/12 bg-white/80 px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-gold-400/50"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={linkCourse}
              onChange={(event) => setLinkCourse(event.target.value)}
              className="rounded-xl border border-brand-900/12 bg-white/80 px-3 py-2 text-xs font-bold text-ink-800 outline-none focus:border-gold-400/50"
              aria-label="ربط بمقرر"
            >
              <option value="">بدون ربط بمقرر</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-600">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              تثبيت في الأعلى
            </label>
            <div className="ms-auto flex items-center gap-2">
              {composerError ? <span className="text-xs font-bold text-ember-600">{composerError}</span> : null}
              <Button size="sm" onClick={() => void save()} disabled={busy}>
                {busy ? 'جارٍ الحفظ…' : editingId ? 'حفظ التعديل' : 'أضف الملاحظة'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* فلاتر */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في ملاحظاتك…"
            className="w-64 pr-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setCourseFilter('ALL')}
          className={cn(
            'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
            courseFilter === 'ALL'
              ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
              : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
          )}
        >
          الكل
        </button>
        {courses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => setCourseFilter(course.id)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-bold transition',
              courseFilter === course.id
                ? 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700'
                : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ink-700',
            )}
          >
            {course.code}
          </button>
        ))}
      </div>

      {/* القايمة */}
      {notes === null ? (
        <RowsSkeleton rows={4} />
      ) : shown.length === 0 ? (
        notes.length === 0 ? (
          <EmptyState
            kind="notes"
            title="الصندوقة فاضية"
            sub="أول ملاحظة تكتبها هيبقى أول لبنة في مذكرتك — ابدأ فوق"
          />
        ) : (
          <EmptyState kind="notes" compact title="مفيش نتيجة للفلتر الحالي" />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {shown.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
            >
              <Card className={cn('h-full', note.pinned && 'border-gold-400/35 shadow-gold-soft')}>
                <CardContent className="flex h-full flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink-950">
                      {note.title || 'ملاحظة'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void togglePin(note)}
                      title={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                      aria-label={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition',
                        note.pinned
                          ? 'border-gold-400/40 bg-gold-400/15 text-gold-700'
                          : 'border-brand-900/10 bg-white/60 text-ink-300 hover:text-gold-700',
                      )}
                    >
                      {note.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-700">{note.body}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="truncate rounded-lg bg-white/75 px-2 py-0.5 text-[10px] font-bold text-ink-400">
                      {note.course ? `${note.course.code} — ${note.course.name}` : 'عامة'}
                      {' · '}
                      {new Date(note.updatedAt).toLocaleDateString('ar-EG')}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(note)}
                        aria-label="تعديل"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-900/10 bg-white/60 text-ink-400 transition hover:text-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(note.id)}
                        aria-label={confirmDelete === note.id ? 'تأكيد الحذف' : 'حذف'}
                        className={cn(
                          'flex h-7 items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-bold transition',
                          confirmDelete === note.id
                            ? 'border-ember-500/50 bg-ember-500 text-white'
                            : 'border-brand-900/10 bg-white/60 text-ink-400 hover:text-ember-600',
                        )}
                      >
                        {confirmDelete === note.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            متأكد؟
                          </>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <span className="mt-8 hidden items-center gap-2 text-[10px] text-ink-300">
        <StickyNote className="h-3 w-3" />
        RAQiB Notes — ملاحظاتك محفوظة في حسابك
      </span>
    </StudentShell>
  );
}
