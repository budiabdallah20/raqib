import { describe, expect, it } from 'vitest';

import {
  buildScheduleICS,
  csvCell,
  nextDateFor,
  parseHM,
  toCSV,
  toICSStamp,
} from '@/lib/exporters';

describe('parseHM', () => {
  it('يقرأ أوقات صالحة', () => {
    expect(parseHM('08:30')).toEqual({ h: 8, m: 30 });
    expect(parseHM('14:05')).toEqual({ h: 14, m: 5 });
  });

  it('يرفض قيماً غير صالحة', () => {
    expect(parseHM('25:00')).toBeNull();
    expect(parseHM('07:70')).toBeNull();
    expect(parseHM('نص')).toBeNull();
  });
});

describe('toICSStamp', () => {
  it('ينسّق الطوابع بدون فواصل', () => {
    const date = new Date(2026, 0, 5, 9, 7);
    expect(toICSStamp(date)).toBe('20260105T090700');
  });
});

describe('nextDateFor', () => {
  it('يرجع نفس اليوم لو اليوم مطابق', () => {
    const friday = new Date(2026, 1, 6); // جمعة (day=5)
    expect(nextDateFor(4, friday).getDay()).toBe(4);
    expect([
      2, 3, 4, 5, 6, 7, 9, 10, 11, 12,
    ]).toContain(nextDateFor(4, friday).getDate());
  });

  it('يرجع الأسبوع المستقبل لو اليوم فات', () => {
    const thursday = new Date(2026, 1, 12); // خميس
    const nextMonday = nextDateFor(1, thursday);
    expect(nextMonday > thursday).toBe(true);
    expect(nextMonday.getDay()).toBe(1);
  });
});

describe('buildScheduleICS', () => {
  const slot = {
    day: 2, // الاثنين
    from: '08:30',
    to: '10:30',
    title: 'قواعد بيانات',
    code: 'CS101',
    room: 'B303',
    teacher: 'أحمد',
  };

  it('يبني VCALENDAR وVEVENT صالحين', () => {
    const ics = buildScheduleICS([slot], 1, new Date(2026, 1, 9));
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:CS101 — قواعد بيانات');
    expect(ics).toContain('LOCATION:د. أحمد · قاعة B303');
    expect(ics).toContain('DTSTART:2026');
  });

  it('يوّلد تكرار حسب عدد الأسابيع', () => {
    const one = buildScheduleICS([slot], 1, new Date(2026, 1, 9));
    const two = buildScheduleICS([slot], 2, new Date(2026, 1, 9));
    expect(one.split('BEGIN:VEVENT').length - 1).toBe(1);
    expect(two.split('BEGIN:VEVENT').length - 1).toBe(2);
  });

  it('يتخطى فترات غير صالحة', () => {
    const broken = { ...slot, to: '07:00' }; // النهاية قبل البداية
    const ics = buildScheduleICS([broken], 1);
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});

describe('CSV', () => {
  it('csvCell يهرب الفواصل والأسطر', () => {
    expect(csvCell('ok')).toBe('ok');
    expect(csvCell('he said "hi", ok')).toBe('"he said ""hi"", ok"');
    expect(csvCell('س\nطر')).toBe('"س\nطر"');
    expect(csvCell(null)).toBe('');
  });

  it('toCSV يضيف BOM ويجمع صفوفه CRLF', () => {
    const csv = toCSV([['أ', 'ب'], [1, 2]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('أ,ب\r\n1,2');
  });
});
