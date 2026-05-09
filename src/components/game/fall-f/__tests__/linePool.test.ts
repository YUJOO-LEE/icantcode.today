import { describe, it, expect } from 'vitest';
import { STATIC_GROUPS, DYNAMIC_GROUPS, ALL_GROUPS } from '../linePool';
import { groupSegments } from '../solvability';

describe('linePool', () => {
  it('every group has a non-empty line list', () => {
    for (const g of ALL_GROUPS) {
      expect(g.lines.length).toBeGreaterThan(0);
    }
  });

  it('every group has gap of 1 or 2', () => {
    for (const g of ALL_GROUPS) {
      expect([1, 2]).toContain(g.gap);
    }
  });

  it('group ids are unique', () => {
    const ids = ALL_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every static group renders to at least one platform segment', () => {
    for (const g of STATIC_GROUPS) {
      expect(groupSegments(g).length).toBeGreaterThan(0);
    }
  });

  it('has both static and dynamic pools populated', () => {
    expect(STATIC_GROUPS.length).toBeGreaterThanOrEqual(10);
    expect(DYNAMIC_GROUPS.length).toBeGreaterThanOrEqual(2);
  });
});
