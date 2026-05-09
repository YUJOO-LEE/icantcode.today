import { describe, it, expect } from 'vitest';
import {
  applyGravity,
  applyHorizontal,
  autoSlide,
  clampX,
  detectDeath,
  findSupportingRow,
  inputDirection,
  settle,
} from '../physics';
import { PLAYER_GRAVITY_CELLS_PER_SEC, PLAYER_MOVE_CELLS_PER_SEC } from '../constants';
import type { GroupRow, Player } from '../types';

const VIEWPORT = { rows: 25, cols: 80 };

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { x: 5, y: 0, falling: true, input: 'none', ...overrides };
}

function makeRow(topRow: number, startX = 0, endX = 10, id = 'g'): GroupRow {
  return {
    id: `${id}-${topRow}`,
    groupId: id,
    isLastOfGroup: true,
    lineIndex: 0,
    lineNumber: 1,
    source: null,
    text: 'x'.repeat(endX - startX + 1),
    segments: [{ startX, endX }],
    topRow,
    ageSec: 0,
  };
}

describe('clampX', () => {
  it('keeps player inside [0, cols-1]', () => {
    expect(clampX(-3, 10)).toBe(0);
    expect(clampX(15, 10)).toBe(9);
    expect(clampX(5, 10)).toBe(5);
  });
});

describe('inputDirection', () => {
  it('cancels both', () => {
    expect(inputDirection('both')).toBe(0);
    expect(inputDirection('none')).toBe(0);
  });
  it('maps left/right', () => {
    expect(inputDirection('left')).toBe(-1);
    expect(inputDirection('right')).toBe(1);
  });
});

describe('applyGravity', () => {
  it('does nothing when not falling', () => {
    const p = makePlayer({ falling: false, y: 5 });
    expect(applyGravity(p, 1).y).toBe(5);
  });

  it('increases y by gravity * dt when falling', () => {
    const p = makePlayer({ falling: true, y: 5 });
    expect(applyGravity(p, 1).y).toBeCloseTo(5 + PLAYER_GRAVITY_CELLS_PER_SEC);
  });
});

describe('applyHorizontal', () => {
  it('moves left at PLAYER_MOVE_CELLS_PER_SEC * dt', () => {
    const p = makePlayer({ x: 10 });
    const next = applyHorizontal(p, 'left', 0.5, 80);
    expect(next.x).toBeCloseTo(10 - PLAYER_MOVE_CELLS_PER_SEC * 0.5);
  });

  it('clamps to cols', () => {
    const p = makePlayer({ x: 0 });
    const next = applyHorizontal(p, 'left', 1, 80);
    expect(next.x).toBe(0);
  });
});

describe('autoSlide', () => {
  it('pulls player back inside the segment from the right edge', () => {
    const player = makePlayer({ x: 12 });
    const segment = { startX: 0, endX: 8 };
    expect(autoSlide(player, segment).x).toBe(8);
  });

  it('pulls player back inside the segment from the left edge', () => {
    const player = makePlayer({ x: 1 });
    const segment = { startX: 5, endX: 10 };
    expect(autoSlide(player, segment).x).toBe(5);
  });

  it('returns the same player when already inside the segment', () => {
    const player = makePlayer({ x: 6 });
    const segment = { startX: 5, endX: 10 };
    expect(autoSlide(player, segment)).toBe(player);
  });
});

describe('detectDeath', () => {
  it('returns timeout when y < 0', () => {
    expect(detectDeath(makePlayer({ y: -0.1 }), VIEWPORT)).toBe('timeout');
  });

  it('returns segfault when y >= rows', () => {
    expect(detectDeath(makePlayer({ y: VIEWPORT.rows }), VIEWPORT)).toBe('segfault');
  });

  it('returns null inside the viewport', () => {
    expect(detectDeath(makePlayer({ y: 10 }), VIEWPORT)).toBeNull();
  });
});

describe('findSupportingRow', () => {
  it('finds a row when player is one cell above topRow and x is in segment', () => {
    const row = makeRow(5, 3, 7);
    const player = makePlayer({ x: 5, y: 4 });
    expect(findSupportingRow(player, [row])).toBe(row);
  });

  it('returns null when player x is outside any segment', () => {
    const row = makeRow(5, 3, 7);
    const player = makePlayer({ x: 0, y: 4 });
    expect(findSupportingRow(player, [row])).toBeNull();
  });

  it('returns null when player is too far above the row', () => {
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 2 });
    expect(findSupportingRow(player, [row])).toBeNull();
  });
});

describe('settle', () => {
  it('snaps player onto the row above the supporting line and clears falling', () => {
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 4.7, falling: true });
    const { player: next, supporting } = settle(player, [row]);
    expect(supporting).toBe(row);
    expect(next.falling).toBe(false);
    expect(next.y).toBe(4);
  });

  it('marks player as falling when no supporting row', () => {
    const row = makeRow(5, 0, 1);
    const player = makePlayer({ x: 5, y: 5 });
    const { player: next, supporting } = settle(player, [row]);
    expect(supporting).toBeNull();
    expect(next.falling).toBe(true);
  });
});
