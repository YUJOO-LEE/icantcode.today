import { describe, it, expect } from 'vitest';
import { pickNextGroup, groupSegments, groupMaxLineWidth } from '../solvability';
import { mulberry32 } from '../rng';
import { SOLVABILITY } from '../constants';
import { STATIC_GROUPS, ALL_GROUPS } from '../linePool';
import { minGapBetween } from '../segments';
import type { LineGroup } from '../types';

const COLS = 100;

describe('pickNextGroup', () => {
  it('returns a group from the pool', () => {
    const rng = mulberry32(42);
    const group = pickNextGroup({ recentGroups: [], cols: COLS }, rng);
    expect(ALL_GROUPS).toContain(group);
  });

  it('R-1: after K consecutive short groups, next pick is non-short', () => {
    const rng = mulberry32(7);
    const threshold = SOLVABILITY.shortLineRatio * COLS;
    const shortPool = STATIC_GROUPS.filter((g) => groupMaxLineWidth(g) <= threshold);
    const recent = Array(SOLVABILITY.shortLineRunCap).fill(shortPool[0]).filter(Boolean) as LineGroup[];
    expect(recent.length).toBe(SOLVABILITY.shortLineRunCap);
    const next = pickNextGroup({ recentGroups: recent, cols: COLS }, rng);
    expect(groupMaxLineWidth(next)).toBeGreaterThan(threshold);
  });

  it('R-2: 1000 random picks all keep adjacency within budget', () => {
    const rng = mulberry32(123);
    const recent: LineGroup[] = [];
    for (let i = 0; i < 1000; i++) {
      const next = pickNextGroup({ recentGroups: recent, cols: COLS }, rng);
      const last = recent[recent.length - 1];
      if (last) {
        const a = groupSegments(last);
        const b = groupSegments(next);
        if (a.length > 0 && b.length > 0) {
          expect(minGapBetween(a, b)).toBeLessThanOrEqual(SOLVABILITY.adjacencyMaxGapCells);
        }
      }
      recent.push(next);
      if (recent.length > 10) recent.shift();
    }
  });

  it('is deterministic given the same seed', () => {
    const seq1 = pickRunSeq(7);
    const seq2 = pickRunSeq(7);
    expect(seq1).toEqual(seq2);
  });
});

function pickRunSeq(seed: number): string[] {
  const rng = mulberry32(seed);
  const recent: LineGroup[] = [];
  const ids: string[] = [];
  for (let i = 0; i < 30; i++) {
    const next = pickNextGroup({ recentGroups: recent, cols: COLS }, rng);
    ids.push(next.id);
    recent.push(next);
    if (recent.length > 10) recent.shift();
  }
  return ids;
}
