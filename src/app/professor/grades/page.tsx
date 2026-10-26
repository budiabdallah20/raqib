'use client';

import * as React from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Save } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

type Course = { id: string; name: string; code: string };
type StudentGrade = {
  id: string;
  name: string;
  studentCode: string | null;
  group: string | null;
  grade: { quiz: number | null; work: number | null; midterm: number | null } | null;
};

type Row = {
  studentId: string;
  name: string;
  studentCode: string | null;
  group: string | null;
  quiz: string;
  work: string;
  midterm: string;
};

type RowStatus = 'idle' | 'saving' | 'saved' | 'error';

const MAX_COMPONENT = 60;
const FIELDS = ['quiz', 'work', 'midterm'] as const;
type FieldName = (typeof FIELDS)[number];

const FIELD_LABELS: Record<FieldName, string> = {
  quiz: 'كويز',
  work: 'أعمال',
  midterm: 'ميدترم',
};

/** يقرأ قيمة الخانة: '' = فارغ (null)، وإلا رقم 0..60 أو خطأ */
function parseComponent(value: string): { ok: true; value: number | null } | { ok: false } {
  if (value.trim() === '') return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > MAX_COMPONENT) return { ok: false };
  return { ok: true, value: n };
}

/** حوّل قيمة الخانة إلى (null للأفراغ، undefined عند الخطأ) */
function toField(value: string): number | null | undefined {
  const parsed = parseComponent(value);
  return parsed.ok ? parsed.value : undefined;
}

function rowToPayload(row: Row) {
  return {
    studentId: row.studentId,
    quiz: toField(row.quiz),
    work: toField(row.work),
    midterm: toField(row.midterm),
  };
}

function isRowValid(row: Row) {
  return FIELDS.every((f) => parseComponent(row[f]).ok);
}

function totalOf(row: Row): string {
  const values = FIELDS.map((f) => parseComponent(row[f]));
  if (values.every((v) => !v.ok || v.value === null)) return '—';
  let sum = 0;
  for (const v of values) if (v.ok && v.value !== null) sum += v.value;
  return String(Math.round(sum * 100) / 100);
}

function downloadCsv(rows: Row[], courseCode: string) {
  const header = ['كود الطالب', 'الاسم', 'الجروب', 'كويز', 'أعمال', 'ميدترم', 'الإجمالي'];
  const cell = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        cell(row.studentCode || ''),
        cell(row.name),
        cell(row.group || ''),
        cell(row.quiz.trim() || ''),
        cell(row.work.trim() || ''),
        cell(row.midterm.trim() || ''),
        cell(totalOf(row) === '—' ? '' : totalOf(row)),
      ].join(','),
    );
  }
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grades-${courseCode || 'course'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProfessorGradesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [courseId, setCourseId] = React.useState('');
  const [courseLabel, setCourseLabel] = React.useState('');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [baselines, setBaselines] = React.useState<Record<string, string>>({});
  const [statuses, setStatuses] = React.useState<Record<string, RowStatus>>({});
  const [loading, setLoading] = React.useState(false);
  const [savingAll, setSavingAll] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    api<{ courses: Course[] }>('/api/courses')
      .then((data) => setCourses(data.courses))
      .catch((err) => setError((err as Error).message));
  }, []);

  const loadGrades = React.useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const data = await api<{ course: Course; students: StudentGrade[] }>(
        `/api/grades?courseId=${encodeURIComponent(id)}`,
      );
      const nextRows: Row[] = data.students.map((student) => ({
        studentId: student.id,
        name: student.name,
        studentCode: student.studentCode,
        group: student.group,
        quiz: student.grade?.quiz === null || student.grade?.quiz === undefined ? '' : String(student.grade.quiz),
        work: student.grade?.work === null || student.grade?.work === undefined ? '' : String(student.grade.work),
        midterm:
          student.grade?.midterm === null || student.grade?.midterm === undefined ? '' : String(student.grade.midterm),
      }));
      const nextBaselines: Record<string, string> = {};
      for (const row of nextRows) nextBaselines[row.studentId] = `${row.quiz}|${row.work}|${row.midterm}`;
      setRows(nextRows);
      setBaselines(nextBaselines);
      setStatuses({});
      setCourseLabel(`${data.course.code} — ${data.course.name}`);
    } catch (err) {
      setError((err as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function updateCell(studentId: string, field: FieldName, value: string) {
    setRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, [field]: value } : row)));
    setNotice('');
  }

  function setRowStatus(studentId: string, status: RowStatus) {
    setStatuses((s) => ({ ...s, [studentId]: status }));
  }

  async function saveRow(row: Row) {
    if (!courseId) return;
    if (!isRowValid(row)) {
      setRowStatus(row.studentId, 'error');
      setError(`درجة غير صالحة للطالب ${row.name} — القيم يجب أن تكون بين 0 و ${MAX_COMPONENT}`);
      return;
    }
    setError('');
    setNotice('');
    setRowStatus(row.studentId, 'saving');
    try {
      await api<{ updated: number }>('/api/grades', {
        method: 'PUT',
        body: JSON.stringify({ courseId, rows: [rowToPayload(row)] }),
      });
      const dirty = `${row.quiz}|${row.work}|${row.midterm}`;
      setBaselines((prev) => ({ ...prev, [row.studentId]: dirty }));
      setRowStatus(row.studentId, 'saved');
    } catch (err) {
      setError((err as Error).message);
      setRowStatus(row.studentId, 'error');
    }
  }

  async function saveAll() {
    if (!courseId || rows.length === 0) return;
    const invalid = rows.find((row) => !isRowValid(row));
    if (invalid) {
      setError(`درجة غير صالحة للطالب ${invalid.name} — القيم يجب أن تكون بين 0 و ${MAX_COMPONENT}`);
      return;
    }
    setError('');
    setNotice('');
    setSavingAll(true);
    try {
      const data = await api<{ updated: number }>('/api/grades', {
        method: 'PUT',
        body: JSON.stringify({ courseId, rows: rows.map(rowToPayload) }),
      });
      setBaselines(Object.fromEntries(rows.map((row) => [row.studentId, `${row.quiz}|${row.work}|${row.midterm}`])));
      setStatuses(Object.fromEntries(rows.map((row) => [row.studentId, 'saved' as RowStatus])));
      setNotice(`تم حفظ درجات ${data.updated} طالب بنجاح`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingAll(false);
    }
  }

  const dirtyCount = rows.filter(
    (row) => `${row.quiz}|${row.work}|${row.midterm}` !== baselines[row.studentId],
  ).length;

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient">الدرجات</h1>
          <p className="mt-1 text-ink-500">إدخال الكويز والأعمال والميدترم لكل طالب — اضغط Enter لحفظ صف واحد</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="courseId">المقرر</Label>
            <select
              id="courseId"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                void loadGrades(e.target.value);
              }}
              className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm text-ink-900 outline-none transition focus:border-gold-400/60 focus:ring-2 focus:ring-gold-500/20"
            >
              <option value="" className="text-black">
                اختر المقرر
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id} className="text-black">
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </div>
          {courseId && rows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadCsv(rows, courseLabel.split(' — ')[0])}>
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
              <Button size="sm" onClick={saveAll} disabled={savingAll}>
                {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ الكل{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? <FormMessage className="mb-4">{error}</FormMessage> : null}
      {notice ? (
        <p className="mb-4 rounded-xl border border-gold-400/25 bg-gold-500/10 px-3 py-2 text-sm text-gold-800" role="status">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-gold-700" />
            جارٍ تحميل الدرجات…
          </CardContent>
        </Card>
      ) : null}

      {!loading && courseId && rows.length === 0 && !error ? (
        <Card>
          <CardContent className="py-10 text-center text-ink-400">لا يوجد طلاب مسجلين في هذا المقرر</CardContent>
        </Card>
      ) : null}

      {!loading && rows.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-gold-gradient">{courseLabel}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right">
              <thead>
                <tr className="border-b border-brand-900/10 text-xs text-ink-500">
                  <th className="px-2 py-3 font-semibold">الطالب</th>
                  <th className="px-2 py-3 font-semibold">الجروب</th>
                  {FIELDS.map((field) => (
                    <th key={field} className="px-2 py-3 text-center font-semibold">
                      {FIELD_LABELS[field]}
                      <span className="block text-[10px] font-normal text-ink-400">من {MAX_COMPONENT}</span>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center font-semibold">الإجمالي</th>
                  <th className="px-2 py-3 text-center font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rawStatus = statuses[row.studentId] || 'idle';
                  const invalid = !isRowValid(row);
                  const dirty = `${row.quiz}|${row.work}|${row.midterm}` !== baselines[row.studentId];
                  const status: RowStatus = rawStatus === 'saved' && dirty ? 'idle' : rawStatus;
                  return (
                    <tr key={row.studentId} className="border-b border-brand-900/[0.07] transition hover:bg-white/605">
                      <td className="px-2 py-2.5">
                        <p className="font-semibold text-ink-900">{row.name}</p>
                        <p className="font-latin text-[11px] text-ink-400" dir="ltr">
                          {row.studentCode || '—'}
                        </p>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="rounded-lg bg-white/70 px-2 py-1 text-xs font-bold text-gold-700">
                          {row.group || '—'}
                        </span>
                      </td>
                      {FIELDS.map((field) => (
                        <td key={field} className="px-1.5 py-2.5">
                          <Input
                            inputMode="decimal"
                            aria-label={`${FIELD_LABELS[field]} لـ ${row.name}`}
                            value={row[field]}
                            onChange={(e) => updateCell(row.studentId, field, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                                void saveRow(row);
                              }
                            }}
                            onBlur={() => {
                              if (dirty) void saveRow(row);
                            }}
                            className={`h-9 w-20 text-center [appearance:textfield] ${
                              invalid
                                ? 'border-ember-500/60 focus:ring-ember-500/20'
                                : status === 'saved'
                                  ? 'border-gold-400/40'
                                  : ''
                            }`}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-display text-lg font-bold text-gold-gradient">
                        {totalOf(row)}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {status === 'saving' ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin text-gold-700" />
                        ) : status === 'saved' ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-gold-700" />
                        ) : status === 'error' || invalid ? (
                          <span className="text-xs font-bold text-ember-600">خطأ</span>
                        ) : dirty ? (
                          <RefreshCw className="mx-auto h-3.5 w-3.5 text-ink-400" />
                        ) : (
                          <span className="text-[11px] text-ink-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !courseId ? (
        <Card>
          <CardContent className="py-10 text-center text-ink-400">اختر مقررًا أولًا لعرض درجاته</CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
