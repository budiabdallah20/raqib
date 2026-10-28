'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  History,
  ListChecks,
  Presentation,
  TimerReset,
  Users,
} from 'lucide-react';
import QRCode from 'qrcode';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { attendancePercent, formatDate } from '@/lib/utils';

type Course = { id: string; name: string; code: string; _count?: { enrollments: number; lectures: number } };
type Lecture = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  isOpen: boolean;
  qrToken: string | null;
  course: { name: string; code: string };
  _count: { attendances: number };
};
type ProfessorTask = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  kind: string;
  course: { code: string; name: string };
  _count?: { submissions: number };
};
type AttendanceRecord = {
  id: string;
  status: string;
  scannedAt: string;
  student: { name: string; studentCode: string | null };
  lecture: { title: string; course: { name: string; code: string } };
};

const QUICK_ACTIONS = [
  { label: 'الدرجات', icon: ClipboardCheck, href: '/professor/grades', hint: 'إدخال كويز / أعمال / ميدترم' },
  { label: 'التاسكات', icon: ListChecks, href: '/professor/tasks', hint: 'متابعة التسليمات والتقييم' },
  { label: 'الملفات والمراجع', icon: FolderOpen, href: '/professor/resources', hint: 'رفع PDF وربطه بمحاضرة' },
  { label: 'جدولي', icon: CalendarDays, href: '/professor/schedule', hint: 'جدول الجروبين بكروت مقرراتك' },
] as const;

export default function ProfessorPage() {
  const [me, setMe] = React.useState<{ name: string } | null>(null);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [lectures, setLectures] = React.useState<Lecture[]>([]);
  const [tasks, setTasks] = React.useState<ProfessorTask[]>([]);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [error, setError] = React.useState('');
  const [showRecords, setShowRecords] = React.useState(false);
  const [qr, setQr] = React.useState('');
  const [openToken, setOpenToken] = React.useState('');
  const [openLectureId, setOpenLectureId] = React.useState('');

  const load = React.useCallback(async () => {
    const [c, l, t] = await Promise.all([
      api<{ courses: Course[] }>('/api/courses'),
      api<{ lectures: Lecture[] }>('/api/lectures'),
      api<{ tasks: ProfessorTask[] }>('/api/tasks/manage'),
    ]);
    setCourses(c.courses);
    setLectures(l.lectures);
    setTasks(t.tasks);
  }, []);

  React.useEffect(() => {
    api<{ user: { name: string } }>('/api/auth/me').then((data) => setMe(data.user)).catch(() => {});
    load().catch((err) => setError((err as Error).message));
  }, [load]);

  async function loadRecords() {
    try {
      const data = await api<{ records: AttendanceRecord[] }>('/api/attendance');
      setRecords(data.records);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createLecture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<{ lecture: Lecture }>('/api/lectures', {
        method: 'POST',
        body: JSON.stringify({
          courseId: form.get('courseId'),
          title: form.get('title'),
          location: form.get('location'),
        }),
      });
      await showQr(data.lecture.qrToken, data.lecture.id);
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function showQr(token?: string | null, lectureId?: string) {
    if (!token) return;
    const origin = window.location.origin;
    const payload = `${origin}/student?token=${token}`;
    setOpenToken(token);
    if (lectureId) setOpenLectureId(lectureId);
    setQr(await QRCode.toDataURL(payload, { width: 360, margin: 1 }));
  }

  async function toggle(id: string) {
    setError('');
    try {
      const data = await api<{ lecture: Lecture }>('/api/lectures', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggle', id }),
      });
      if (data.lecture.isOpen) await showQr(data.lecture.qrToken, data.lecture.id);
      else {
        setQr('');
        setOpenToken('');
        setOpenLectureId('');
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // ── إحصائيات مبنية كليًا على بيانات مقرراته فقط ──
  const students = courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
  const enrolledByCode = new Map(courses.map((course) => [course.code, course._count?.enrollments || 0] as const));
  const totalAttended = lectures.reduce((sum, lecture) => sum + (lecture._count?.attendances || 0), 0);
  const totalPossible = lectures.reduce(
    (sum, lecture) => sum + (enrolledByCode.get(lecture.course.code) || 0),
    0,
  );
  const avgAttendance = attendancePercent(totalAttended, totalPossible);
  const openTasks = tasks.filter((task) => task.status === 'OPEN');
  const nearestDeadline = openTasks
    .map((task) => new Date(task.deadline))
    .filter((deadline) => deadline.getTime() > Date.now())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <DashboardShell>
      {/* كارت الترحيب */}
      <Card className="mb-8 overflow-hidden border-gold-400/25 bg-gradient-to-l from-gold-500/[0.12] via-transparent to-transparent shadow-gold-soft">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gold-700">أهلًا بك من جديد 👋</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-gold-gradient">
              د. {me?.name || '…'}
            </h1>
            <p className="mt-2 text-ink-500">
              هتدرّس
              <span className="mx-1 font-bold text-gold-700">{courses.length}</span>
              مقررات هذا الترم — ابدأ من فتح محاضرة أو متابعة الدرجات.
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            {courses.slice(0, 4).map((course) => (
              <span
                key={course.id}
                className="rounded-xl border border-gold-400/25 bg-gold-500/10 px-3 py-1.5 font-display text-xs font-bold text-gold-800"
              >
                {course.code}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* كروت الإحصائيات */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="عدد طلابك" value={students} icon={Users} hint={`في ${courses.length} مقررات`} />
        <StatsCard title="عدد محاضراتك" value={lectures.length} icon={Presentation} hint="آخر 50 محاضرة" />
        <StatsCard title="متوسط حضور مقرراتك" value={`${avgAttendance}%`} icon={Activity} hint="إجمالي فحص QR داخل محاضراتك" />
        <StatsCard
          title="تاسكات مفتوحة"
          value={openTasks.length}
          icon={TimerReset}
          hint={
            nearestDeadline
              ? `أقرب مهلة: ${formatDistanceToNow(nearestDeadline, { addSuffix: true, locale: ar })}`
              : 'لا توجد تاسكات مفتوحة'
          }
        />
      </div>

      {/* إجراءات سريعة */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-brand-900/10 bg-white/60 p-4 transition duration-300 hover:border-gold-400/45 hover:bg-gold-500/[0.08] hover:shadow-gold-soft"
            >
              <action.icon className="h-5 w-5 text-gold-700 transition group-hover:scale-110" />
              <p className="mt-2 font-bold text-ink-900">{action.label}</p>
              <p className="mt-0.5 text-xs text-ink-400">{action.hint}</p>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowRecords((prev) => !prev);
              if (!showRecords) void loadRecords();
            }}
            className="group rounded-2xl border border-brand-900/10 bg-white/60 p-4 text-right transition duration-300 hover:border-gold-400/45 hover:bg-gold-500/[0.08] hover:shadow-gold-soft"
          >
            <History className="h-5 w-5 text-gold-700 transition group-hover:scale-110" />
            <p className="mt-2 font-bold text-ink-900">سجل الحضور</p>
            <p className="mt-0.5 text-xs text-ink-400">آخر عمليات تسجيل الطلاب</p>
          </button>
        </CardContent>
      </Card>

      {/* سجل الحضور (يعرض عند الطلب) */}
      {showRecords ? (
        <Card className="mb-8 border-gold-400/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-gold-700" />
              سجل الحضور الأخير
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {records.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-400">لا يوجد تسجيلات حضور بعد</p>
            ) : (
              records.slice(0, 12).map((record) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-900/10 bg-white/65 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{record.student.name}</p>
                    <p className="text-xs text-ink-400">
                      {record.lecture.course.code} · {record.lecture.title} · {formatDate(record.scannedAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      record.status === 'LATE'
                        ? 'bg-gold-500/15 text-gold-700'
                        : 'bg-brand-500/10 text-brand-700'
                    }`}
                  >
                    {record.status === 'LATE' ? 'متأخر' : 'حاضر'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {error ? <FormMessage className="mb-6">{error}</FormMessage> : null}

      {/* لوحة الـ QR والمحاضرات — كما تعمل بدون أي تغيير */}
      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">محاضرة جديدة</TabsTrigger>
          <TabsTrigger value="lectures">المحاضرات</TabsTrigger>
          <TabsTrigger value="courses">المقررات</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>فتح محاضرة</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={createLecture}>
                <FormField>
                  <Label htmlFor="courseId">المقرر</Label>
                  <select
                    id="courseId"
                    name="courseId"
                    required
                    className="flex h-11 w-full rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm"
                  >
                    <option value="">اختر المقرر</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="text-black">
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="title">عنوان المحاضرة</Label>
                  <Input id="title" name="title" required />
                </FormField>
                <FormField>
                  <Label htmlFor="location">القاعة</Label>
                  <Input id="location" name="location" placeholder="قاعة 3" />
                </FormField>
                <FormMessage>{error}</FormMessage>
                <Button type="submit" className="w-full">
                  إنشاء وفتح QR
                </Button>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>رمز الحضور</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qr ? (
                <>
                  <img src={qr} alt="QR" className="rounded-xl bg-white p-3" />
                  <p className="break-all text-center text-xs text-ink-400">{openToken}</p>
                  <a
                    href={`/professor/board?lectureId=${openLectureId}`}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/[0.08] px-4 py-2 text-sm font-semibold text-gold-700 transition hover:bg-gold-500/[0.15]"
                  >
                    🪧 لوحة عرض كاملة (لجهاز العرض)
                  </a>
                </>
              ) : (
                <p className="py-8 text-center text-ink-400">سيظهر الرمز هنا بعد فتح المحاضرة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lectures">
          <div className="grid gap-3">
            {lectures.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-ink-400">لا توجد محاضرات بعد</CardContent>
              </Card>
            ) : null}
            {lectures.map((lecture) => (
              <Card key={lecture.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{lecture.title}</p>
                    <p className="text-sm text-ink-500">
                      {lecture.course.code} · حضور {lecture._count.attendances}
                    </p>
                    <p className="text-xs text-ink-400">{formatDate(lecture.startsAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {lecture.isOpen ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => showQr(lecture.qrToken, lecture.id)}>
                          عرض QR
                        </Button>
                        <a
                          href={`/professor/board?lectureId=${lecture.id}`}
                          className="inline-flex h-9 items-center rounded-xl border border-gold-500/25 bg-gold-500/[0.08] px-3 text-xs font-semibold text-gold-700 transition hover:bg-gold-500/[0.15]"
                        >
                          لوحة العرض
                        </a>
                      </>
                    ) : null}
                    <Button size="sm" variant={lecture.isOpen ? 'danger' : 'default'} onClick={() => toggle(lecture.id)}>
                      {lecture.isOpen ? 'إغلاق' : 'فتح'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="card-glow">
                <CardContent className="p-4">
                  <p className="font-display text-xs font-bold text-gold-700">{course.code}</p>
                  <p className="mt-0.5 font-semibold">{course.name}</p>
                  <p className="mt-1 text-sm text-ink-400">
                    {course._count?.enrollments || 0} طالب · {course._count?.lectures || 0} محاضرة
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
