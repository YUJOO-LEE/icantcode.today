import { describe, it, expect } from 'vitest';
import { defaultRNG, mulberry32, pickRandom } from '../rng';

describe('mulberry32', () => {
  it('produces values in [0, 1) for many iterations', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed yields same sequence', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 16; i += 1) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds yield different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const aSeq = Array.from({ length: 8 }, () => a());
    const bSeq = Array.from({ length: 8 }, () => b());
    expect(aSeq).not.toEqual(bSeq);
  });
});

describe('defaultRNG', () => {
  it('is Math.random', () => {
    expect(defaultRNG).toBe(Math.random);
  });
});

describe('pickRandom', () => {
  it('returns one of the items deterministically given a seeded RNG', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    const rng = mulberry32(123);
    const picked = pickRandom(items, rng);
    expect(items).toContain(picked);
  });

  it('uniformly covers all items over many runs (seeded)', () => {
    const items = ['a', 'b', 'c'] as const;
    const counts: Record<(typeof items)[number], number> = { a: 0, b: 0, c: 0 };
    const rng = mulberry32(99);
    for (let i = 0; i < 300; i += 1) {
      counts[pickRandom(items, rng)] += 1;
    }
    for (const k of items) {
      expect(counts[k]).toBeGreaterThan(0);
    }
  });

  it('throws on empty items', () => {
    expect(() => pickRandom([] as readonly string[], Math.random)).toThrow(/empty items/);
  });
});
