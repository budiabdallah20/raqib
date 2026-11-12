import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '../src/lib/safe-return';

describe('safe return path', () => {
  it('keeps a same-role destination after sign-in', () => {
    expect(safeReturnPath('/student/schedule?week=1', 'STUDENT')).toBe('/student/schedule?week=1');
  });
  it('does not use another role or an external destination', () => {
    expect(safeReturnPath('/admin', 'STUDENT')).toBe('/student');
    expect(safeReturnPath('//example.com', 'STUDENT')).toBe('/student');
    expect(safeReturnPath('/\\example.com', 'STUDENT')).toBe('/student');
    expect(safeReturnPath('javascript:alert(1)', 'STUDENT')).toBe('/student');
  });
});
