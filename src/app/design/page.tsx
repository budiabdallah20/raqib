'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  BarChart3,
  ClipboardCheck,
  Clock3,
  Cpu,
  Flame,
  GraduationCap,
  MapPin,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import { PortalShell } from '@/components/obsidian/PortalShell';
import { GlassCard, GlassPanelHeader } from '@/components/obsidian/GlassCard';
import { StatTile } from '@/components/obsidian/StatTile';
import { ProgressRing } from '@/components/obsidian/ProgressRing';

/* ────────────────────────────────────────────────────────────────────────────
   DESIGN PREVIEW — /design
   Styleguide + full portal composition. Content here is illustrative only and
   is never read from or written to the academic database.
   ──────────────────────────────────────────────────────────────────────────── */

const PREVIEW_COURSES = [
  { code: 'MAT201', name: 'معادلات تفاضلية عادية', pct: 72, tone: 'primary' as const },
  { code: 'MAT213', name: 'المنطق الرياضي', pct: 54, tone: 'violet' as const },
  { code: 'COM201', name: 'تحليل وتصميم نظم', pct: 88, tone: 'ok' as const },
];

const WEEK = [
  { day: 'السبت', value: 0 },
  { day: 'الأحد', value: 100 },
  { day: 'الاثنين', value: 100 },
  { day: 'الثلاثاء', value: 50 },
  { day: 'الأربعاء', value: 100 },
  { day: 'الخميس', value: 0 },
  { day: 'الجمعة', value: 0 },
];

const SLOTS = [
  { time: '10:30', course: 'MAT201', room: 'قاعة 1', kind: 'محاضرة', tone: 'info' },
  { time: '12:30', course: 'MAT213', room: 'VIP Hall 2', kind: 'محاضرة', tone: 'info' },
  { time: '14:30', course: 'COM201', room: 'معمل الحاسب', kind: 'معمل', tone: 'warn' },
];

const FEED = [
  {
    icon: ClipboardCheck,
    tone: 'text-blue-300',
    title: 'تكليف جديد في تحليل وتصميم نظم',
    meta: 'قبل ١٢ دقيقة · ينتهي ٢٥ أكتوبر',
  },
  {
    icon: Flame,
    tone: 'text-amber-300',
    title: 'حضورك في المنطق الرياضي انخفض إلى ٥٤٪',
    meta: 'أقل من حد الإنذار — ٧٥٪',
  },
  {
    icon: GraduationCap,
    tone: 'text-violet-300',
    title: 'محاضرة معادلات تفاضلية أُعيدت إلى ١١:٠٠',
    meta: 'أمس · قاعة 1',
  },
];

export default function DesignPreviewPage() {
  return (
    <PortalShell
      role="STUDENT"
      title="لوحتي الأكاديمية"
      subtitle="الفصل الدراسي الأول · الفرقة الثانية · جروب B"
      user={{ name: 'معاينة التصميم', email: 'preview@raqib.edu' }}
      actions={
        <Link href="/student" className="o-btn o-btn-primary hidden sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          الدخول الحقيقي
        </Link>
      }
    >
      {/* ── preview notice ─────────────────────────────────────────── */}
      <div className="o-fade mb-4 flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/[0.07] px-3.5 py-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_8px_2px_rgba(96,165,250,.7)]" />
        <p className="text-[11px] font-semibold text-blue-200/90">
          معاينة نظام التصميم <span className="font-mono text-blue-300">Obsidian Glass</span> — كل
          الأرقام هنا توضيحية للعرض فقط، وليست سجلات أكاديمية.
        </p>
      </div>

      {/* ── hero ───────────────────────────────────────────────────── */}
      <GlassCard glow className="o-rise overflow-hidden p-5 sm:p-6">
        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="o-eyebrow">Student Command Center</p>
            <h2 className="o-heading mt-2 text-2xl leading-tight sm:text-[28px]">
              مساء الخير، <span className="o-text-gradient">طالبنا</span> 👋
            </h2>
            <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-obs-text2">
              ١٧ ساعة كحد أقصى · جدولك محدَّث · ونسبة الحضور محسوبة لحظيًا من سجلات المنصة.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="o-chip o-chip--ok">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> المنصة تعمل
              </span>
              <span className="o-chip o-chip--info">
                <CalendarClock className="h-3 w-3" /> الترم الأول
              </span>
              <span className="o-chip">
                <Timer className="h-3 w-3" /> الحصة القادمة بعد ٤٢ دقيقة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <ProgressRing
              value={12}
              max={17}
              size={112}
              label={
                <span className="text-[17px]">
                  12<span className="text-[11px] text-obs-text3">/17</span>
                </span>
              }
              caption="ساعة معتمدة"
              tone="primary"
            />
            <div className="hidden flex-col gap-2 sm:flex">
              <span className="o-chip o-chip--warn">
                <Flame className="h-3 w-3" /> إنذار غياب: المنطق الرياضي
              </span>
              <span className="o-chip">
                <MapPin className="h-3 w-3" /> قاعة 1 · مبنى الرياضيات
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── KPI row ────────────────────────────────────────────────── */}
      <div className="o-rise mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="المقررات المسجّلة"
          value="5"
          unit="مقرر"
          hint="من أصل ٧ متاحة"
          icon={BookOpen}
          trend="flat"
          trendLabel="ثابت"
          tone="primary"
        />
        <StatTile
          label="نسبة الحضور"
          value="86"
          unit="%"
          hint="محسوبة من ٢٨ محاضرة"
          icon={BarChart3}
          trend="up"
          trendLabel="+4٪"
          tone="ok"
        />
        <StatTile
          label="تكليفات مستحقة"
          value="2"
          hint="أقرب موعد بعد يومين"
          icon={ClipboardCheck}
          trend="down"
          trendLabel="−1"
          tone="violet"
        />
        <StatTile
          label="ساعات معتمدة"
          value="12"
          unit="/17"
          hint="٥ ساعات متبقية"
          icon={GraduationCap}
          trend="up"
          trendLabel="متاح"
          tone="cyan"
        />
      </div>

      {/* ── main grid ──────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* attendance + week */}
        <GlassCard className="o-rise p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="o-eyebrow">Attendance</p>
              <h3 className="o-heading mt-1 text-[15px]">حضور الأسبوع</h3>
            </div>
            <span className="o-chip o-chip--ok">
              <TrendingUp className="h-3 w-3" /> أعلى من العتبة
            </span>
          </div>

          <div className="mt-6 flex h-[132px] items-end justify-between gap-2 sm:gap-3">
            {WEEK.map((d) => {
              const active = d.value > 0;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-[104px] w-full items-end overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-blue-600/80 via-blue-500/60 to-violet-400/70 shadow-[0_0_22px_-6px_rgba(59,130,246,.9)] transition-[height] duration-500"
                      style={{ height: `${active ? Math.max(12, d.value) : 4}%` }}
                    />
                    {!active ? (
                      <span className="absolute inset-x-0 bottom-1 text-center text-[8px] text-obs-text3">
                        لا محاضرات
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[9.5px] font-semibold text-obs-text3">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.06] text-center">
            {[
              { label: 'حاضر', value: '24', tone: 'text-emerald-300' },
              { label: 'متأخر', value: '2', tone: 'text-amber-300' },
              { label: 'غائب', value: '2', tone: 'text-rose-300' },
            ].map((s) => (
              <div key={s.label} className="px-2">
                <p className={`font-display text-[19px] font-extrabold ${s.tone}`}>{s.value}</p>
                <p className="mt-0.5 text-[10px] text-obs-text3">{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* today */}
        <GlassCard className="o-rise p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="o-eyebrow">Today</p>
              <h3 className="o-heading mt-1 text-[15px]">محاضرات اليوم</h3>
            </div>
            <span className="o-chip">٣ حصص</span>
          </div>

          <ul className="mt-4 flex flex-col gap-2.5">
            {SLOTS.map((slot) => (
              <li
                key={slot.time}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/[0.13] hover:bg-white/[0.04]"
              >
                <span className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-white/[0.07] bg-black/30 py-1.5">
                  <Clock3 className="h-3 w-3 text-obs-text3" aria-hidden />
                  <span className="mt-0.5 font-mono text-[10px] font-bold text-obs-text2">
                    {slot.time}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-obs-text">{slot.course}</p>
                  <p className="mt-0.5 truncate text-[10px] text-obs-text3">
                    {slot.room} · {slot.kind}
                  </p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-obs-text3 transition group-hover:text-blue-300" />
              </li>
            ))}
          </ul>

          <button type="button" className="o-btn mt-4 w-full">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            الجدول الأسبوعي الكامل
          </button>
        </GlassCard>
      </div>

      {/* ── courses ────────────────────────────────────────────────── */}
      <GlassCard className="o-rise mt-4 p-5">
        <GlassPanelHeader
          eyebrow="Enrolled"
          title="مقرراتي"
          className="px-0 pt-0"
          action={
            <Link href="/student/materials" className="o-chip o-chip--info">
              كل المواد <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PREVIEW_COURSES.map((course) => (
            <div
              key={course.code}
              className="group relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent p-4 transition hover:-translate-y-0.5 hover:border-white/[0.16]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold tracking-widest text-blue-300/80">
                    {course.code}
                  </p>
                  <p className="mt-1 truncate text-[12.5px] font-bold text-obs-text">{course.name}</p>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-obs-text3 transition group-hover:text-blue-300">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[9.5px] font-semibold text-obs-text3">
                  <span>تقدّم المادة</span>
                  <span className="text-obs-text2">{course.pct}٪</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-400 shadow-[0_0_10px_rgba(96,165,250,.55)]"
                    style={{ width: `${course.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── feed + AI ──────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="o-rise p-5">
          <GlassPanelHeader eyebrow="Activity" title="آخر التحديثات" className="px-0 pt-0" />
          <ul className="mt-4 flex flex-col">
            {FEED.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < FEED.length - 1 ? (
                    <span className="absolute end-[15px] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-white/12 to-transparent" />
                  ) : null}
                  <span className="relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-white/[0.09] bg-white/[0.04]">
                    <Icon className={`h-3.5 w-3.5 ${item.tone}`} aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[12px] font-semibold leading-snug text-obs-text">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] text-obs-text3">{item.meta}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard glow shine spotlight className="o-rise p-5">
          <div className="relative z-[1]">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-violet-400/25 bg-gradient-to-b from-violet-500/25 to-violet-500/0">
              <Cpu className="h-4 w-4 text-violet-200" aria-hidden />
            </span>
            <h3 className="o-heading mt-3 text-[15px]">المساعد الذكي للمقرر</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-obs-text2">
              إجابات مبنيّة على مواد المقرر المعتمدة فقط، مع ذكر المصدر لكل إجابة.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="o-chip o-chip--info">RAG</span>
              <span className="o-chip">حصص يومية</span>
              <span className="o-chip">بعيد عن بياناتك</span>
            </div>
            <button type="button" className="o-btn o-btn-primary mt-4 w-full" disabled>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              قيد التطوير
            </button>
          </div>
        </GlassCard>
      </div>

      {/* ── styleguide strip ───────────────────────────────────────── */}
      <GlassCard className="o-rise mt-4 p-5">
        <GlassPanelHeader eyebrow="Style guide" title="عناصر النظام" className="px-0 pt-0" />

        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div>
            <p className="o-eyebrow mb-2">Chips</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="o-chip">محايد</span>
              <span className="o-chip o-chip--ok">حاضر</span>
              <span className="o-chip o-chip--warn">متأخر</span>
              <span className="o-chip o-chip--danger">غائب</span>
              <span className="o-chip o-chip--info">معلومة</span>
            </div>
          </div>

          <div>
            <p className="o-eyebrow mb-2">Rings</p>
            <div className="flex items-center gap-3">
              <ProgressRing value={86} size={62} stroke={6} tone="ok" />
              <ProgressRing value={54} size={62} stroke={6} tone="warn" />
              <ProgressRing value={22} size={62} stroke={6} tone="danger" />
            </div>
          </div>

          <div>
            <p className="o-eyebrow mb-2">Loading</p>
            <div className="flex flex-col gap-1.5">
              <div className="o-skel h-2.5 w-full" />
              <div className="o-skel h-2.5 w-4/5" />
              <div className="o-skel h-2.5 w-2/3" />
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" className="o-btn o-btn-primary !px-3 !py-1.5 !text-[11px]">
                أساسي
              </button>
              <button type="button" className="o-btn !px-3 !py-1.5 !text-[11px]">
                ثانوي
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
          <table className="o-table">
            <thead>
              <tr>
                <th>المقرر</th>
                <th>المحاضرات</th>
                <th>الحضور</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-obs-text">MAT201 · معادلات تفاضلية</td>
                <td>١٤</td>
                <td>٩٢٪</td>
                <td>
                  <span className="o-chip o-chip--ok">آمن</span>
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-obs-text">MAT213 · المنطق الرياضي</td>
                <td>١٤</td>
                <td>٥٤٪</td>
                <td>
                  <span className="o-chip o-chip--danger">إنذار</span>
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-obs-text">COM201 · تحليل وتصميم نظم</td>
                <td>١٢</td>
                <td>٧٨٪</td>
                <td>
                  <span className="o-chip o-chip--warn">تحت المراقبة</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ── contrast / a11y note ───────────────────────────────────── */}
      <div className="o-rise mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
        <Users className="h-3.5 w-3.5 text-obs-text3" aria-hidden />
        <p className="text-[10.5px] text-obs-text3">
          تباين النص الأساسي على الخلفية ≥ 4.5:1 · الحركة تُلغى تلقائيًا مع
          <span className="font-mono text-obs-text2"> prefers-reduced-motion </span>·
          كل عناصر التحكم قابلة للوصول بلوحة المفاتيح.
        </p>
      </div>
    </PortalShell>
  );
}
