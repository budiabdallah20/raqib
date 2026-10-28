'use client';

import * as React from 'react';
import { FileDown, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Course = { id: string; name: string; code: string };
type Lecture = { id: string; title: string; courseId: string };
type ResourceItem = {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  createdAt: string;
  lecture: { id: string; title: string } | null;
};

const MAX_BYTES = 20 * 1024 * 1024;

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

/** رفع عبر XHR لعرض نسبة التقدم الحقيقية */
function uploadWithProgress(
  file: File,
  courseId: string,
  onProgress: (percent: number) => void,
) {
  type Uploaded = {
    storedName: string;
    url: string;
    size: number;
    uploadToken: string;
  };
  return new Promise<Uploaded>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/resource');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const data = (xhr.response || {}) as { error?: string } & Partial<Uploaded>;
      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        data.storedName &&
        data.uploadToken
      ) {
        resolve(data as Uploaded);
      } else {
        reject(new Error(data.error || 'تعذر رفع الملف'));
      }
    };
    xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع'));
    const form = new FormData();
    form.append('file', file);
    form.append('courseId', courseId);
    xhr.send(form);
  });
}

export default function ProfessorResourcesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [lectures, setLectures] = React.useState<Lecture[]>([]);
  const [courseId, setCourseId] = React.useState('');
  const [lectureId, setLectureId] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [resources, setResources] = React.useState<ResourceItem[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      api<{ courses: Course[] }>('/api/courses'),
      api<{ lectures: Lecture[] }>('/api/lectures'),
    ])
      .then(([c, l]) => {
        setCourses(c.courses);
        setLectures(l.lectures);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  const loadList = React.useCallback(async (id: string) => {
    if (!id) return;
    setLoadingList(true);
    try {
      const data = await api<{ resources: ResourceItem[] }>(
        `/api/resources?courseId=${encodeURIComponent(id)}`,
      );
      setResources(data.resources);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const courseLectures = lectures.filter((lecture) => lecture.courseId === courseId);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    setNotice('');
    const selected = event.target.files?.[0] || null;
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('حجم الملف يتجاوز 20 ميجابايت');
      event.target.value = '';
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!courseId) {
      setError('اختر المقرر أولًا');
      return;
    }
    if (!file) {
      setError('اختر ملف PDF للرفع');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadWithProgress(file, courseId, setProgress);
      await api<{ resource: ResourceItem }>('/api/resources', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          lectureId: lectureId || null,
          storedName: uploaded.storedName,
          originalName: file.name,
          size: uploaded.size,
          uploadToken: uploaded.uploadToken,
        }),
      });
      setNotice(`تم رفع «${file.name}» وربطه بالمقرر بنجاح`);
      setFile(null);
      setLectureId('');
      const input = document.getElementById('resourceFile') as HTMLInputElement | null;
      if (input) input.value = '';
      await loadList(courseId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function deleteResource(item: ResourceItem) {
    if (!window.confirm(`حذف «${item.originalName}» نهائيًا؟`)) return;
    setError('');
    setNotice('');
    try {
      await api('/api/resources', { method: 'DELETE', body: JSON.stringify({ id: item.id }) });
      setResources((prev) => prev.filter((r) => r.id !== item.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gold-gradient">الملفات والمراجع</h1>
        <p className="mt-1 text-ink-500">رفع ملفات PDF وربطها بمقرراتك ومحاضراتك</p>
      </div>

      {error ? <FormMessage className="mb-6">{error}</FormMessage> : null}
      {notice ? (
        <p className="mb-6 rounded-xl border border-gold-400/25 bg-gold-500/10 px-3 py-2 text-sm text-gold-800" role="status">
          {notice}
        </p>
      ) : null}

      {/* الرفع */}
      <Card className="mb-8 border-gold-400/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-gold-700" />
            رفع ملف جديد (PDF فقط · حتى 20 ميجابايت)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="grid gap-4 lg:grid-cols-3">
            <FormField>
              <Label htmlFor="courseId">المقرر</Label>
              <select
                id="courseId"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setLectureId('');
                  void loadList(e.target.value);
                }}
                className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm text-ink-900 outline-none transition focus:border-gold-400/60"
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
            </FormField>
            <FormField>
              <Label htmlFor="lectureId">المحاضرة (اختياري)</Label>
              <select
                id="lectureId"
                value={lectureId}
                onChange={(e) => setLectureId(e.target.value)}
                disabled={!courseId || courseLectures.length === 0}
                className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm text-ink-900 outline-none transition focus:border-gold-400/60 disabled:opacity-40"
              >
                <option value="" className="text-black">
                  بدون محاضرة
                </option>
                {courseLectures.map((lecture) => (
                  <option key={lecture.id} value={lecture.id} className="text-black">
                    {lecture.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField>
              <Label htmlFor="resourceFile">الملف</Label>
              <input
                id="resourceFile"
                type="file"
                accept=".pdf,application/pdf"
                onChange={pickFile}
                disabled={uploading}
                className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-3 py-2.5 text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink-950 outline-none"
              />
            </FormField>

            {file ? (
              <div className="lg:col-span-3 flex flex-wrap items-center gap-3 rounded-xl border border-gold-400/20 bg-gold-500/[0.06] px-4 py-3">
                <FileText className="h-5 w-5 text-gold-700" />
                <span className="text-sm font-semibold text-ink-900">{file.name}</span>
                <span className="text-xs text-ink-400">{humanSize(file.size)}</span>
              </div>
            ) : null}

            {uploading ? (
              <div className="lg:col-span-3">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-gold-sheen bg-[length:180%_100%] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-center text-xs text-gold-700">جارٍ الرفع… {progress}%</p>
              </div>
            ) : null}

            <div className="lg:col-span-3">
              <Button type="submit" disabled={uploading || !file || !courseId}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                رفع وربط الملف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* القائمة */}
      {!courseId ? (
        <Card>
          <CardContent className="py-10 text-center text-ink-400">
            اختر مقررًا لعرض ملفاته المرفوعة
          </CardContent>
        </Card>
      ) : loadingList ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-gold-700" />
            جارٍ تحميل الملفات…
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>ملفات المقرر ({resources.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {resources.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">لا توجد ملفات مرفوعة لهذا المقرر بعد</p>
            ) : (
              resources.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-900/10 bg-white/65 px-4 py-3 transition hover:border-gold-400/25"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-xl bg-gold-500/15 p-2 text-gold-700">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{item.originalName}</p>
                      <p className="text-xs text-ink-400">
                        {humanSize(item.size)} · {formatDate(item.createdAt)}
                        {item.lecture ? ` · ${item.lecture.title}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={item.url} target="_blank" rel="noreferrer" download>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4" />
                        تحميل
                      </Button>
                    </a>
                    <Button variant="danger" size="sm" onClick={() => deleteResource(item)}>
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
