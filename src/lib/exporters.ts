/**
 * 📤 مصدّرات البوابة — ملفات ICS (تقويم Google) و CSV (Excel) من المتصفح مباشرة.
 * دوال نقية (Pure) حتى تُفحص في vitest؛ downloadBlob هي الجسر الوحيد لجهاز المستخدم.
 */

export type ICSInput = {
  /** يوم في قاعدة البيانات: 2=الاثنين 3=الثلاثاء 4=الأربعاء 5=الخميس */
  day: number;
  /** وقت البداية "08:30" */
  from: string;
  /** وقت النهاية "10:30" */
  to: string;
  title: string;
  code?: string;
  room?: string | null;
  teacher?: string | null;
};

const WEEKDAYS: number[][] = [
  [7, 0], // الاحتياط
  [1, 0], // (غير مستخدمة)
];

/** يوم الجريد (1=الأحد..7=السبت) → رقم اليوم في Date (0=الأحد..6=السبت) */
function jsDayOf(schedDay: number): number {
  return schedDay - 1;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toICSStamp(date: Date): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}${pad2(date.getMinutes())}00`
  );
}

export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function parseHM(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return { h, m };
}

/** تاريخ أقرب حدوث ليوم معين من أيام الأسبوع (يشمل النهاردة) */
export function nextDateFor(jsDay: number, from = new Date()): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const delta = (jsDay - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + delta);
  return date;
}

/**
 * يبني تقويم ICS للمحاضرات الأسبوعية — يولّد تكرارات واضحة لعدد أسابيع
 * بدل RRULE حتى تظهر الموعد الإضافي (الغياب/التعديل) بوضوح للطالب.
 */
export function buildScheduleICS(slots: ICSInput[], weeks = 8, now = new Date()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RAQiB//Schedule//AR',
    'CALSCALE:GREGORIAN',
  ];
  let counter = 0;
  for (let weekOffset = 0; weekOffset < weeks; weekOffset += 1) {
    for (const slot of slots) {
      const startHM = parseHM(slot.from);
      const endHM = parseHM(slot.to);
      if (!startHM || !endHM) continue;
      const start = nextDateFor(jsDayOf(slot.day), now);
      start.setDate(start.getDate() + weekOffset * 7);
      start.setHours(startHM.h, startHM.m, 0, 0);
      const end = new Date(endHM.h, endHM.m, 0, 0);
      end.setTime(end.getTime() - (endHM.h * 3600 + endHM.m * 60) * 1000);
      end.setFullYear(start.getFullYear(), start.getMonth(), start.getDate());
      end.setHours(endHM.h, endHM.m, 0, 0);
      if (end <= start) continue;
      counter += 1;
      const name = slot.code ? `${slot.code} — ${slot.title}` : slot.title;
      lines.push(
        'BEGIN:VEVENT',
        `UID:raqib-${start.getTime()}-${counter}@raqib.app`,
        `DTSTAMP:${toICSStamp(now)}`,
        `DTSTART:${toICSStamp(start)}`,
        `DTEND:${toICSStamp(end)}`,
        `SUMMARY:${icsEscape(name)}`,
      );
      const parts = [
        slot.teacher ? `د. ${slot.teacher}` : null,
        slot.room ? `قاعة ${slot.room}` : null,
      ].filter(Boolean) as string[];
      if (parts.length) lines.push(`LOCATION:${icsEscape(parts.join(' · '))}`);
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/* ── CSV ── */

export function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/* ── التنزيل ── */

export function downloadBlob(filename: string, mime: string, text: string) {
  if (typeof window === 'undefined' || typeof Blob === 'undefined') return;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export { WEEKDAYS };
