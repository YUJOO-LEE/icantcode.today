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

  // Tab (`\t`) and other "wider than 1ch when rendered" whitespace breaks the
  // visual ↔ logical-column alignment that everything in physics relies on:
  // `getSegments` counts a tab as one column, but `whitespace-pre` expands it
  // to the next tab stop on screen — so the player ends up logically on a
  // later segment while visually floating in the expanded blank. The CSS
  // `tabSize: 1` guard in GameField defends the rendering side; this test
  // defends the data side so future authors don't reintroduce the mismatch.
  it('contains no tab characters in any pattern', () => {
    const textsOf = (group: (typeof ALL_GROUPS)[number]): string[] =>
      group.lines.flatMap((line) => {
        switch (line.kind) {
          case 'static':
            return [line.text];
          case 'grow-right':
            return [line.initial, line.growChar];
          case 'fill-right':
            return [line.initial, line.filled, line.empty];
          case 'alternating':
            return [line.patternA, line.patternB];
          case 'shifting':
            return [line.pattern];
        }
      });
    for (const g of ALL_GROUPS) {
      for (const text of textsOf(g)) {
        expect(text.includes('\t'), `group "${g.id}" has a tab in "${text}"`).toBe(false);
      }
    }
  });
});
