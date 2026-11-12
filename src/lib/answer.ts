/**
 * 🧮 تصحيح حتمي للإجابات القصيرة + تطبيع العربية — دوال pure بلا أي خدمة خارجية.
 * يطبّع: الفراغات، الهمزات (إأآا→ا)، الألف المقصورة (ى→ي)، التاء المربوطة (ة→ه)، التشكيل والتطويل.
 */

export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // تشكيل + تطويل
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export type ShortGradeResult = { correct: boolean; awarded: number };

/** مطابقة بعد التطبيع ضد قائمة الإجابات المقبولة — النتيجة 0 أو العلامة كاملة */
export function gradeShortAnswer(rawAnswer: string | null | undefined, accepted: string[], marks: number): ShortGradeResult {
  if (!rawAnswer) return { correct: false, awarded: 0 };
  const candidate = normalizeAnswer(rawAnswer);
  if (!candidate) return { correct: false, awarded: 0 };
  const ok = accepted.some((item) => normalizeAnswer(item) === candidate);
  return ok ? { correct: true, awarded: marks } : { correct: false, awarded: 0 };
}

export function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
    return [];
  } catch {
    return [];
  }
}

export function safeStringifyArray(values: string[]): string {
  return JSON.stringify(values.filter((item) => typeof item === 'string' && item.trim().length > 0));
}
