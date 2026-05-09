import { describe, it, expect } from 'vitest';
import { getSegments, unionSegments, minGapBetween, maxLineWidth } from '../segments';

describe('getSegments', () => {
  it('returns single segment for unbroken text', () => {
    expect(getSegments('hello')).toEqual([{ startX: 0, endX: 4 }]);
  });

  it('splits on spaces', () => {
    expect(getSegments('a  bc')).toEqual([
      { startX: 0, endX: 0 },
      { startX: 3, endX: 4 },
    ]);
  });

  it('returns empty for blank text', () => {
    expect(getSegments('   ')).toEqual([]);
  });

  it('honors empty char overrides', () => {
    expect(getSegments('[█░█]', new Set([' ', '░']))).toEqual([
      { startX: 0, endX: 1 },
      { startX: 3, endX: 4 },
    ]);
  });
});

describe('unionSegments', () => {
  it('merges overlapping/adjacent segments', () => {
    const merged = unionSegments([
      [{ startX: 0, endX: 2 }],
      [{ startX: 3, endX: 5 }],
      [{ startX: 10, endX: 12 }],
    ]);
    expect(merged).toEqual([
      { startX: 0, endX: 5 },
      { startX: 10, endX: 12 },
    ]);
  });
});

describe('minGapBetween', () => {
  it('returns 0 for overlap', () => {
    expect(minGapBetween([{ startX: 0, endX: 5 }], [{ startX: 3, endX: 7 }])).toBe(0);
  });

  it('returns the cell gap for separated segments', () => {
    expect(minGapBetween([{ startX: 0, endX: 2 }], [{ startX: 8, endX: 10 }])).toBe(5);
  });

  it('returns Infinity when either side has no segments', () => {
    expect(minGapBetween([], [{ startX: 0, endX: 5 }])).toBe(Infinity);
    expect(minGapBetween([{ startX: 0, endX: 5 }], [])).toBe(Infinity);
    expect(minGapBetween([], [])).toBe(Infinity);
  });

  it('still returns the gap when b is to the left of a', () => {
    // Forces the `sa.startX - sb.endX - 1` branch on line 53.
    expect(minGapBetween([{ startX: 10, endX: 12 }], [{ startX: 0, endX: 2 }])).toBe(7);
  });
});

describe('maxLineWidth', () => {
  it('ignores trailing whitespace', () => {
    expect(maxLineWidth('hello    ')).toBe(5);
  });
});
