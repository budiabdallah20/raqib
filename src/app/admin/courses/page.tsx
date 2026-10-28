'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { AdminModal } from '@/components/admin/AdminModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { DEPARTMENT } from '@/lib/constants';

type Course = {
  id: string;
  code: string;
  name: string;
  englishName: string | null;
  department: string;
  professor: { id: string; name: string } | null;
  _count: { enrollments: number; slots: number; lectures: number };
};

type Professor = { id: string; name: string; isActive: boolean; courses: { code: string }[] };

function professorsDialog(list: Professor[]) {
  return list.filter((p) => p.isActive);
}

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [professors, setProfessors] = React.useState<Professor[]>([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const activeProfessors = professorsDialog(professors);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, profsRes] = await Promise.all([
        api<{ courses: Course[] }>('/api/admin/courses'),
        api<{ rows: Professor[] }>('/api/admin/professors'),
      ]);
      setCourses(coursesRes.courses);
      setProfessors(profsRes.rows);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = courses.filter((course) =>
    !q.trim()
      ? true
      : `${course.code} ${course.name} ${course.englishName ?? ''} ${course.professor?.name ?? ''}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
  );

  function afterSave(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(''), 3500);
    void load();
  }

  async function submitModal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      name: form.get('name'),
      englishName: form.get('englishName') || undefined,
      professorId: form.get('professorId'),
      department: form.get('department') || DEPARTMENT,
    };
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/courses`, {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, ...body }),
        });
        afterSave('تم تحديث المقرر');
      } else {
        body.code = form.get('code');
        await api(`/api/admin/courses`, { method: 'POST', body: JSON.stringify(body) });
        afterSave('تم إنشاء المقرر');
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeProfessor(course: Course, professorId: string) {
    if (!professorId) return;
    setError('');
    try {
      await api('/api/admin/courses', {
        method: 'PATCH',
        body: JSON.stringify({ id: course.id, professorId }),
      });
      afterSave(`تم إسناد المقرر`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeCourse(course: Course) {
    if (course._count.lectures + course._count.enrollments + course._count.slots > 0) {
      setError('المقرر مرتبط ببيانات أخرى — لا يمكن حذفه');
      return;
    }
    if (!window.confirm(`حذف المقرر «${course.code} — ${course.name}» نهائيًا؟`)) return;
    setDeletingId(course.id);
    setError('');
    try {
      await api('/api/admin/courses', { method: 'DELETE', body: JSON.stringify({ id: course.id }) });
      afterSave('تم حذف المقرر');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const inputCls = 'h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-3 text-sm text-ink-950 placeholder:text-ink-300';
  const selectCls = `${inputCls} [&>option]:text-black`;

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">إدارة المقررات</h1>
          <p className="mt-1 text-ink-500">إسناد ومتابعة المواد — وكل عملية تُسجل في سجل التدقيق</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="gap-2"
        >
          <Plus size={16} /> مادة جديدة
        </Button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-ember-500/30 bg-ember-500/10 p-3 text-sm text-ember-600">{error}</p>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-600">{notice}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث في المقررات…"
            className="h-10 w-full rounded-xl border border-brand-900/10 bg-white/60 px-3 pr-9 text-sm text-ink-950 placeholder:text-ink-300"
          />
        </div>
      </div>

      <Card className="border-brand-900/10 bg-white/70">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-ink-950">
            <span className="flex items-center gap-2"><BookOpen size={18} className="text-gold-700" /> المقررات</span>
            <span className="text-xs font-normal text-ink-400">{loading ? 'جارٍ التحميل…' : `${filtered.length} مقرر`}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-right text-sm">
            <thead>
              <tr className="border-b border-brand-900/10 text-xs text-ink-400">
                <th className="pb-3 pl-2 font-normal">المقرر</th>
                <th className="pb-3 font-normal">القسم</th>
                <th className="pb-3 font-normal">الدكتور (تغيير)</th>
                <th className="pb-3 font-normal">الطلاب / الكروت</th>
                <th className="pb-3 font-normal">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course, i) => (
                <motion.tr
                  key={course.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-brand-900/[0.08] last:border-0"
                >
                  <td className="py-3 pl-2">
                    <p className="font-semibold text-ink-950">
                      <span className="font-latin font-bold text-gold-700">{course.code}</span> — {course.name}
                    </p>
                    {course.englishName ? <p className="font-latin text-xs text-ink-400">{course.englishName}</p> : null}
                  </td>
                  <td className="py-3 text-xs text-ink-500">{course.department}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={course.professor?.id ?? ''}
                        onChange={(e) => changeProfessor(course, e.target.value)}
                        className="h-9 max-w-52 rounded-lg border border-brand-900/10 bg-white/60 px-2 text-xs text-ink-950"
                        title="تغيير الدكتور"
                      >
                        {course.professor ? <option value={course.professor.id} className="text-black">{course.professor.name}</option> : <option value="" className="text-black">بدون دكتور</option>}
                        {activeProfessors.map((p) => (
                          <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                        ))}
                      </select>
                      <Pencil size={13} className="shrink-0 text-ink-300" />
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-white/60 px-2 py-0.5 text-xs text-ink-600">
                      {course._count.enrollments} طالب · {course._count.slots} كروت
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditing(course); setModalOpen(true); }}
                        className="gap-1.5 px-2 text-ink-600"
                      >
                        <Pencil size={14} /> تعديل
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeCourse(course)}
                        disabled={
                          deletingId === course.id ||
                          course._count.lectures + course._count.enrollments + course._count.slots > 0
                        }
                        title={course._count.lectures + course._count.enrollments + course._count.slots > 0 ? 'مرتبط ببيانات أخرى' : 'حذف'}
                        className="gap-1.5 px-2"
                      >
                        {deletingId === course.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {deletingId === course.id ? '' : 'حذف'}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 ? <p className="py-8 text-center text-sm text-ink-400">لا توجد مقررات</p> : null}
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'تعديل مقرر' : 'مادة جديدة'}>
        <form onSubmit={submitModal} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-ink-500">كود المقرر *</label>
            <input
              name="code"
              required={!editing}
              defaultValue={editing?.code ?? ''}
              disabled={Boolean(editing)}
              dir="ltr"
              placeholder="CS201"
              className={`${inputCls} font-latin ${editing ? 'opacity-50' : ''}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-500">الاسم *</label>
            <input name="name" required defaultValue={editing?.name ?? ''} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-500">الاسم بالإنجليزية</label>
            <input name="englishName" dir="ltr" defaultValue={editing?.englishName ?? ''} className={`${inputCls} font-latin`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-500">الدكتور *</label>
            <select name="professorId" required defaultValue={editing?.professor?.id ?? ''} className={selectCls}>
              <option value="" className="text-black">اختر الدكتور</option>
              {activeProfessors.map((p) => (
                <option key={p.id} value={p.id} className="text-black">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-500">القسم</label>
            <input name="department" defaultValue={editing?.department ?? DEPARTMENT} className={inputCls} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? 'حفظ التعديلات' : 'إنشاء المقرر'}
          </Button>
        </form>
      </AdminModal>
    </DashboardShell>
  );
}
