import { describe, it, expect } from 'vitest';
import { lineContentOffsetX, lineSegmentsAt, renderLine } from '../dynamicLine';
import type {
  AlternatingLine,
  FillRightLine,
  GrowRightLine,
  ShiftingLine,
  StaticLine,
} from '../types';

const staticLine: StaticLine = { kind: 'static', text: '$ npm run build' };

describe('renderLine', () => {
  it('returns static text unchanged', () => {
    expect(renderLine(staticLine, 5)).toBe('$ npm run build');
  });

  it('grow-right: appends growChar over time at growPerSec rate', () => {
    const line: GrowRightLine = {
      kind: 'grow-right',
      initial: 'loading.',
      growChar: '.',
      growPerSec: 5,
    };
    expect(renderLine(line, 0)).toBe('loading.');
    expect(renderLine(line, 0.4)).toBe('loading...'); // 5*0.4 = 2 appended
  });

  it('grow-right: caps at maxWidth', () => {
    const line: GrowRightLine = {
      kind: 'grow-right',
      initial: 'go',
      growChar: '.',
      growPerSec: 100,
    };
    expect(renderLine(line, 1, 5)).toBe('go...');
  });

  it('fill-right: returns initial unchanged when total length ≤ 2', () => {
    const line: FillRightLine = {
      kind: 'fill-right',
      initial: '[]',
      periodSec: 2,
      filled: '█',
      empty: '░',
    };
    expect(renderLine(line, 0)).toBe('[]');
    expect(renderLine(line, 1)).toBe('[]');
    expect(renderLine(line, 5)).toBe('[]');
  });

  it('fill-right: starts full and triangle-waves down then up', () => {
    const line: FillRightLine = {
      kind: 'fill-right',
      initial: '[████████]',
      periodSec: 2,
      filled: '█',
      empty: '░',
    };
    expect(renderLine(line, 0)).toBe('[████████]');
    // halfway through the down-swing (age = 0.5, phase = 0.25 → wave = 0.5).
    expect(renderLine(line, 0.5)).toBe('[████░░░░]');
    // bottom of the swing (age = 1, phase = 0.5 → wave = 1).
    expect(renderLine(line, 1)).toBe('[░░░░░░░░]');
    // back near full (age = 2, phase = 0 again).
    expect(renderLine(line, 2)).toBe('[████████]');
  });
});

describe('lineSegmentsAt', () => {
  it('static line yields runs of non-space chars', () => {
    const segs = lineSegmentsAt(staticLine, 0);
    expect(segs.length).toBeGreaterThan(0);
  });

  it('fill-right empty glyphs split segments', () => {
    const line: FillRightLine = {
      kind: 'fill-right',
      initial: '[████████]',
      periodSec: 2,
      filled: '█',
      empty: '░',
    };
    // At age = 1 the inner is fully emptied, leaving only the brackets as platforms.
    const fullySegmented = lineSegmentsAt(line, 1);
    expect(fullySegmented).toEqual([
      { startX: 0, endX: 0 },
      { startX: 9, endX: 9 },
    ]);
  });

  it('alternating: segments come from patternA at age 0', () => {
    const line: AlternatingLine = {
      kind: 'alternating',
      patternA: '███     ███     ',
      patternB: '     ███     ███',
      periodSec: 1.5,
    };
    expect(lineSegmentsAt(line, 0)).toEqual([
      { startX: 0, endX: 2 },
      { startX: 8, endX: 10 },
    ]);
  });

  it('alternating: segments switch to patternB after one full period', () => {
    const line: AlternatingLine = {
      kind: 'alternating',
      patternA: '███     ',
      patternB: '     ███',
      periodSec: 1.5,
    };
    // Just past the first flip — patternB is now active.
    expect(lineSegmentsAt(line, 1.6)).toEqual([{ startX: 5, endX: 7 }]);
  });
});

describe('renderLine — alternating', () => {
  const line: AlternatingLine = {
    kind: 'alternating',
    patternA: '███     ',
    patternB: '     ███',
    periodSec: 1.5,
  };

  it('starts on patternA at age 0', () => {
    expect(renderLine(line, 0)).toBe('███     ');
  });

  it('stays on patternA for the first periodSec', () => {
    expect(renderLine(line, 0.1)).toBe('███     ');
    expect(renderLine(line, 1.4)).toBe('███     ');
  });

  it('flips to patternB after one period', () => {
    expect(renderLine(line, 1.5)).toBe('     ███');
    expect(renderLine(line, 2.9)).toBe('     ███');
  });

  it('flips back to patternA after two periods', () => {
    expect(renderLine(line, 3.0)).toBe('███     ');
  });

  it('clamps to maxWidth when the pattern is longer than the viewport', () => {
    expect(renderLine(line, 0, 4)).toBe('███ ');
  });
});

describe('renderLine — shifting', () => {
  const line: ShiftingLine = {
    kind: 'shifting',
    pattern: '===',
    periodSec: 0.6,
    initialDirection: 1,
  };

  it('starts at offset 0 with initialDirection +1', () => {
    expect(renderLine(line, 0, 10)).toBe('===       ');
  });

  it('drifts one cell per periodSec', () => {
    expect(renderLine(line, 0.6, 10)).toBe(' ===      ');
    expect(renderLine(line, 1.2, 10)).toBe('  ===     ');
  });

  it('ping-pongs at the right edge of the row', () => {
    // width=10, pattern length 3, range = 7 → bounces after step 7
    expect(renderLine(line, 0.6 * 7, 10)).toBe('       ==='); // peak right
    expect(renderLine(line, 0.6 * 8, 10)).toBe('      === '); // coming back
  });

  it('returns to offset 0 after a full ping-pong cycle (2*range steps)', () => {
    // width=10, range=7 → cycle length = 14 steps
    expect(renderLine(line, 0.6 * 14, 10)).toBe('===       ');
  });

  it('initialDirection -1 starts at the right edge', () => {
    const right: ShiftingLine = { ...line, initialDirection: -1 };
    expect(renderLine(right, 0, 10)).toBe('       ===');
  });
});

describe('lineContentOffsetX', () => {
  it('returns 0 for non-shifting lines', () => {
    expect(lineContentOffsetX({ kind: 'static', text: 'hello' }, 0, 80)).toBe(0);
  });

  it('matches the shifting offset implied by renderLine', () => {
    const line: ShiftingLine = {
      kind: 'shifting',
      pattern: '===',
      periodSec: 0.6,
      initialDirection: 1,
    };
    expect(lineContentOffsetX(line, 0, 10)).toBe(0);
    expect(lineContentOffsetX(line, 0.6, 10)).toBe(1);
    expect(lineContentOffsetX(line, 0.6 * 7, 10)).toBe(7);
    expect(lineContentOffsetX(line, 0.6 * 14, 10)).toBe(0);
  });
});
