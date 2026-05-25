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

  // Visual ↔ logical-column alignment is what everything in physics relies
  // on: `getSegments` and `player.x` (rendered with `${x}ch`) both count
  // each JS code point as one column. Any character that renders wider or
  // narrower than 1ch breaks that contract — the player ends up logically
  // sitting on a later segment while visually catching on (or floating
  // through) the expanded glyph.
  //
  // Two known offenders:
  //   - `\t`: `whitespace-pre` expands tabs to the next tab stop. The CSS
  //     `tabSize: 1` guard in GameField handles the rendering side; this
  //     test handles the data side.
  //   - U+2014 EM DASH and U+25CF BLACK CIRCLE: MulmaruMono ships these
  //     glyphs at advance=192 (=2ch), so they catch the player on their
  //     right edge.
  // Other "fancy" glyphs (✓, ✔, ▸, ➜, █, ░, …) fall back to the system
  // monospace and so far render at 1ch on the platforms we ship to. If a
  // future MulmaruMono revision adds them at >1ch, expand this set.
  it('uses only 1ch-wide characters in pattern text', () => {
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
    const banned: Array<[string, string]> = [
      ['\t', 'tab (\\t) — expands under whitespace-pre'],
      ['—', 'em dash (—) — MulmaruMono draws it 2ch wide'],
      ['●', 'black circle (●) — MulmaruMono draws it 2ch wide'],
    ];
    for (const g of ALL_GROUPS) {
      for (const text of textsOf(g)) {
        for (const [ch, why] of banned) {
          expect(text.includes(ch), `group "${g.id}" contains ${why}: "${text}"`).toBe(false);
        }
      }
    }
  });
});
