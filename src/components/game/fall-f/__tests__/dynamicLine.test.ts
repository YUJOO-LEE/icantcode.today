import { describe, it, expect } from 'vitest';
import { renderLine, lineSegmentsAt } from '../dynamicLine';
import type { FillRightLine, GrowRightLine, StaticLine } from '../types';

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
});
