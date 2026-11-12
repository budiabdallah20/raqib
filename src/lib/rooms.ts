/**
 * أدوات كاشف تعارض القاعة (WP6 — أدمن):
 * «نفس القاعة + نفس الفترة لطرفين = إنذار فوري» (Ultimate §6.7 — صف 16)
 * توحيد المقارنة: تقليم فراغات + توحيد الحروف اللاتينية الكبيرة.
 */
import { SCHED_DAYS, SCHED_PERIODS } from '@/lib/constants';

export function normalizeRoom(room: string | null | undefined) {
  return (room ?? '').trim().toUpperCase();
}

export function roomConflictMessage(input: {
  room: string;
  day: number;
  period: number;
  group: string;
  courseCode: string;
  courseName?: string | null;
}) {
  const dayLabel = SCHED_DAYS.find((d) => d.day === input.day)?.ar ?? `اليوم ${input.day}`;
  const periodLabel = SCHED_PERIODS.find((p) => p.period === input.period)?.time ?? `الحصة ${input.period}`;
  const course = input.courseName ? `${input.courseCode} (${input.courseName})` : input.courseCode;
  return `تعارض قاعة: القاعة «${input.room}» مشغولة في ${dayLabel} — ${periodLabel} بواسطة ${course} للجروب ${input.group}`;
}
