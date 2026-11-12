/**
 * اختبارات التصحيح الحتمي — بلا أي خدمة خارجية، نفس المدخلات ⇒ نفس النتائج.
 */
import { describe, it, expect } from 'vitest';
import { normalizeAnswer, gradeShortAnswer, parseJsonStringArray, safeStringifyArray } from '@/lib/answer';

describe('normalizeAnswer', () => {
  it('يوحّد الهمزات والألف المقصورة والياء', () => {
    expect(normalizeAnswer('أحمد')).toBe('احمد');
    expect(normalizeAnswer('إيمان')).toBe('ايمان');
    expect(normalizeAnswer('على')).toBe('علي');
  });
  it('يوحّد التاء المربوطة إلى هاء', () => {
    expect(normalizeAnswer('قاعدة')).toBe('قاعده');
  });
  it('يزيل التشكيل والتطويل ويوحّد الفراغات', () => {
    expect(normalizeAnswer('  محمّـد   عليّ  ')).toBe('محمد علي');
  });
  it('يتجاهل علامات الترقيم والأحرف الخاصة', () => {
    expect(normalizeAnswer('القاهرة, مصر!')).toBe('القاهره مصر');
  });
  it('الإنجليزية تنخفض وتتطبع فراغاتها', () => {
    expect(normalizeAnswer('  Newton   Second ')).toBe('newton second');
  });
});

describe('gradeShortAnswer', () => {
  const accepted = ['نيوتن', 'Newton', 'نيوتن الثاني'];
  it('مطابقة تامة بعد التطبيع ⇒ العلامة كاملة', () => {
    expect(gradeShortAnswer('نيوتن', accepted, 2)).toEqual({ correct: true, awarded: 2 });
    expect(gradeShortAnswer('  نيوُتـن  ', accepted, 2)).toEqual({ correct: true, awarded: 2 });
    expect(gradeShortAnswer('NEWTON', accepted, 2)).toEqual({ correct: true, awarded: 2 });
  });
  it('إجابة مختلفة ⇒ صفر', () => {
    expect(gradeShortAnswer('أينشتاين', accepted, 2)).toEqual({ correct: false, awarded: 0 });
  });
  it('إجابة فارغة أو null ⇒ صفر', () => {
    expect(gradeShortAnswer('', accepted, 2)).toEqual({ correct: false, awarded: 0 });
    expect(gradeShortAnswer(null, accepted, 2)).toEqual({ correct: false, awarded: 0 });
    expect(gradeShortAnswer('   ', accepted, 2)).toEqual({ correct: false, awarded: 0 });
  });
  it('لا تُمنح علامة جزئية — إما العلامة أو صفر', () => {
    const result = gradeShortAnswer('نيوتن', accepted, 5);
    expect([0, 5]).toContain(result.awarded);
  });
});

describe('parseJsonStringArray / safeStringifyArray', () => {
  it('JSON سليم يُفك بأنواع صحيحة فقط', () => {
    expect(parseJsonStringArray('["أ","ب",1,null,"ج"]')).toEqual(['أ', 'ب', 'ج']);
  });
  it('مدخلات تالفة ⇒ قائمة فارغة بلا استثناء', () => {
    expect(parseJsonStringArray('{not json')).toEqual([]);
    expect(parseJsonStringArray(null)).toEqual([]);
    expect(parseJsonStringArray('{"a":1}')).toEqual([]);
  });
  it('التسلسل يستبعد الفارغ ويُفك مولده الأصلي', () => {
    const raw = safeStringifyArray(['  ', 'أ', 'ب']);
    expect(parseJsonStringArray(raw)).toEqual(['أ', 'ب']);
  });
});
