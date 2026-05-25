import { describe, it, expect } from 'vitest';
import {
  advanceProjectile,
  applyDash,
  applyGravity,
  applyHorizontal,
  applyJump,
  autoSlide,
  canDash,
  canJump,
  clampX,
  detectDeath,
  findSupportingRow,
  findSupportingSegment,
  inputDirection,
  pickDashDirection,
  playerFootCell,
  projectileHitsPlatform,
  projectileHitsPlayer,
  settle,
  tickDashTimers,
} from '../physics';
import {
  COYOTE_TIME_MS,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_HORIZONTAL_CELLS_PER_SEC,
  PLAYER_GRAVITY_CELLS_PER_SEC,
  PLAYER_JUMP_VELOCITY_CELLS_PER_SEC,
  PLAYER_MOVE_CELLS_PER_SEC,
} from '../constants';
import type { Player, Projectile, ScreenRow } from '../types';

const VIEWPORT = { rows: 25, cols: 80 };

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 5,
    y: 0,
    falling: true,
    input: 'none',
    velocityY: 0,
    fellAtMs: null,
    groundY: Number.NEGATIVE_INFINITY,
    dashRemainingMs: 0,
    dashCooldownMs: 0,
    dashDirection: null,
    ...overrides,
  };
}

function makeRow(topRow: number, startX = 0, endX = 10, id = 'g'): ScreenRow {
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
    contentOffsetX: 0,
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
  it('does nothing when not falling and clears velocityY', () => {
    const p = makePlayer({ falling: false, y: 5, velocityY: 7 });
    const next = applyGravity(p, 1);
    expect(next.y).toBe(5);
    expect(next.velocityY).toBe(0);
  });

  it('integrates velocityY into y and accumulates gravity into velocityY', () => {
    const p = makePlayer({ falling: true, y: 5, velocityY: 0 });
    const next = applyGravity(p, 1);
    expect(next.y).toBeCloseTo(5);
    expect(next.velocityY).toBeCloseTo(PLAYER_GRAVITY_CELLS_PER_SEC);
  });

  it('jump arc: velocityY ramps from negative back through zero', () => {
    let p = makePlayer({ falling: true, y: 10, velocityY: -PLAYER_JUMP_VELOCITY_CELLS_PER_SEC });
    // half a second of upward + gravity decel
    p = applyGravity(p, 0.5);
    expect(p.velocityY).toBeCloseTo(-PLAYER_JUMP_VELOCITY_CELLS_PER_SEC + PLAYER_GRAVITY_CELLS_PER_SEC * 0.5);
    expect(p.y).toBeLessThan(10);
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

  it('uses dash speed and direction while dashing', () => {
    const p = makePlayer({ x: 10, dashRemainingMs: 100, dashDirection: 'right' });
    const next = applyHorizontal(p, 'none', 0.1, 80);
    expect(next.x).toBeCloseTo(10 + DASH_HORIZONTAL_CELLS_PER_SEC * 0.1);
  });

  it('left dash with arbitrary current input still goes left', () => {
    const p = makePlayer({ x: 10, dashRemainingMs: 100, dashDirection: 'left' });
    const next = applyHorizontal(p, 'right', 0.1, 80);
    expect(next.x).toBeCloseTo(10 - DASH_HORIZONTAL_CELLS_PER_SEC * 0.1);
  });
});

describe('canJump / applyJump', () => {
  it('allows jump while supported', () => {
    const p = makePlayer({ falling: false });
    expect(canJump(p, 1000)).toBe(true);
  });

  it('allows coyote jump within COYOTE_TIME_MS of falling', () => {
    const p = makePlayer({ falling: true, fellAtMs: 100 });
    expect(canJump(p, 100 + COYOTE_TIME_MS)).toBe(true);
    expect(canJump(p, 100 + COYOTE_TIME_MS - 1)).toBe(true);
  });

  it('rejects jump after the coyote window', () => {
    const p = makePlayer({ falling: true, fellAtMs: 100 });
    expect(canJump(p, 100 + COYOTE_TIME_MS + 1)).toBe(false);
  });

  it('rejects jump while airborne with no fellAtMs (e.g., spawned in air)', () => {
    const p = makePlayer({ falling: true, fellAtMs: null });
    expect(canJump(p, 1000)).toBe(false);
  });

  it('applyJump sets negative velocityY and clears fellAtMs', () => {
    const p = makePlayer({ falling: false, velocityY: 0, fellAtMs: 200 });
    const next = applyJump(p);
    expect(next.falling).toBe(true);
    expect(next.velocityY).toBe(-PLAYER_JUMP_VELOCITY_CELLS_PER_SEC);
    expect(next.fellAtMs).toBeNull();
  });
});

describe('pickDashDirection', () => {
  it('left input → left, regardless of airborne state', () => {
    expect(pickDashDirection(makePlayer({ falling: false, input: 'left' }))).toBe('left');
    expect(pickDashDirection(makePlayer({ falling: true, input: 'left' }))).toBe('left');
  });
  it('right input → right, regardless of airborne state', () => {
    expect(pickDashDirection(makePlayer({ falling: false, input: 'right' }))).toBe('right');
    expect(pickDashDirection(makePlayer({ falling: true, input: 'right' }))).toBe('right');
  });
  it('no direction held (none or both) → null', () => {
    expect(pickDashDirection(makePlayer({ input: 'none' }))).toBeNull();
    expect(pickDashDirection(makePlayer({ input: 'both' }))).toBeNull();
  });
});

describe('canDash / applyDash', () => {
  it('blocks while a dash is still running', () => {
    const p = makePlayer({ input: 'left', dashRemainingMs: 50 });
    expect(canDash(p)).toBe(false);
  });

  it('blocks while cooldown is active', () => {
    const p = makePlayer({ input: 'left', dashRemainingMs: 0, dashCooldownMs: 200 });
    expect(canDash(p)).toBe(false);
  });

  it('blocks when no direction is held', () => {
    expect(canDash(makePlayer({ input: 'none' }))).toBe(false);
    expect(canDash(makePlayer({ input: 'both' }))).toBe(false);
  });

  it('allows when a direction is held and both timers are zero', () => {
    expect(canDash(makePlayer({ input: 'left' }))).toBe(true);
    expect(canDash(makePlayer({ input: 'right' }))).toBe(true);
  });

  it('applyDash sets duration, cooldown and direction', () => {
    const p = makePlayer({ falling: false });
    const next = applyDash(p, 'right');
    expect(next.dashRemainingMs).toBe(DASH_DURATION_MS);
    expect(next.dashCooldownMs).toBe(DASH_COOLDOWN_MS);
    expect(next.dashDirection).toBe('right');
  });
});

describe('tickDashTimers', () => {
  it('decrements both timers and clamps at zero', () => {
    const p = makePlayer({ dashRemainingMs: 30, dashCooldownMs: 500, dashDirection: 'left' });
    const next = tickDashTimers(p, 100);
    expect(next.dashRemainingMs).toBe(0);
    expect(next.dashCooldownMs).toBe(400);
  });

  it('clears dashDirection when remaining hits zero', () => {
    const p = makePlayer({ dashRemainingMs: 30, dashCooldownMs: 500, dashDirection: 'left' });
    const next = tickDashTimers(p, 100);
    expect(next.dashDirection).toBeNull();
  });

  it('keeps dashDirection while remaining > 0', () => {
    const p = makePlayer({ dashRemainingMs: 100, dashCooldownMs: 500, dashDirection: 'right' });
    const next = tickDashTimers(p, 30);
    expect(next.dashRemainingMs).toBe(70);
    expect(next.dashDirection).toBe('right');
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

  it('ignores an airborne row whose stand line is more than one cell above groundY', () => {
    // Player launched from groundY = 6 (stand line). A row at topRow 5 has its
    // stand line at y=4 — two cells above groundY — so a jump must not grab it.
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 5, falling: true, velocityY: 0.5, groundY: 6 });
    expect(findSupportingRow(player, [row])).toBeNull();
  });

  it('still accepts an airborne row exactly one cell above groundY', () => {
    // groundY 6, row at topRow 6 → stand line y=5, one cell up: a valid hop.
    const row = makeRow(6, 0, 10);
    const player = makePlayer({ x: 5, y: 5.5, falling: true, velocityY: 0.5, groundY: 6 });
    expect(findSupportingRow(player, [row])).toBe(row);
  });

  it('does not apply the climb cap to a grounded (non-falling) player', () => {
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 4, falling: false, groundY: 99 });
    expect(findSupportingRow(player, [row])).toBe(row);
  });

  it('does not snap up to a shorter row directly above a grounded player (bug repro)', () => {
    // Lower row at topRow=10, segment 0..20 — long, player stands on it.
    const lower = makeRow(10, 0, 20, 'lower');
    // Upper row at topRow=9, segment 5..8 — short, directly above the lower
    // row (1-row gap, e.g. consecutive lines inside the same group).
    const upper = makeRow(9, 5, 8, 'upper');
    // Player on lower row's stand-line: y = lower.topRow - 1 = 9. Walking
    // right, currently at x=6 — which sits inside upper.segments [5..8].
    const player = makePlayer({ x: 6, y: 9, falling: false });
    // BUG: with rows ordered [upper, lower], findSupportingRow currently
    // matches upper first because dy = upper.topRow - player.y = 0 ∈ [0,1]
    // and player.x is inside upper's segment. settle() then snaps the player
    // up to upper.topRow - 1 = 8 — a free teleport upward without jumping.
    expect(findSupportingRow(player, [upper, lower])).toBe(lower);
  });

  // Foot-cell rounding (visual-match) — see playerFootCell. The player glyph
  // is 1 ch wide, rendered at left=x ch, so its visual center sits at
  // x + 0.5. A foot picked by Math.floor lags half a cell behind the visual
  // center, causing the "falls beside the visible whitespace" / "stands on
  // top of a long whitespace" mismatches reported as fall-f bugs.
  it('treats x=2.7 as standing on col 3 (visual center), not col 2', () => {
    // Platform only covers col 3 — col 2 is whitespace.
    const row = makeRow(5, 3, 5);
    const player = makePlayer({ x: 2.7, y: 4, falling: false });
    expect(findSupportingRow(player, [row])).toBe(row);
  });

  it('falls off when visual center clears the segment, even if floor(x) is still on it', () => {
    // Platform covers cols 0..2. Player at x=2.6 has visual center at 3.1,
    // i.e. mostly over col 3 (whitespace). Old floor-based pick said col 2
    // (still on), letting the player visually float over the empty space.
    const row = makeRow(5, 0, 2);
    const player = makePlayer({ x: 2.6, y: 4, falling: false });
    expect(findSupportingRow(player, [row])).toBeNull();
  });
});

describe('playerFootCell', () => {
  it('rounds to the visually predominant column', () => {
    expect(playerFootCell(2.0)).toBe(2);
    expect(playerFootCell(2.4)).toBe(2);
    expect(playerFootCell(2.5)).toBe(3); // tie breaks toward the right cell
    expect(playerFootCell(2.7)).toBe(3);
  });
});

describe('findSupportingSegment', () => {
  it('uses the visually predominant cell, not floor(x)', () => {
    // Two adjacent platforms separated by a 2-cell gap at cols 3..4.
    const row = makeRow(5, 0, 2);
    row.segments = [
      { startX: 0, endX: 2 },
      { startX: 5, endX: 8 },
    ];
    row.text = 'abc  defg';
    // x=4.6 → visual center 5.1, predominantly in col 5 (right platform).
    expect(findSupportingSegment(row, 4.6)).toEqual({ startX: 5, endX: 8 });
    // x=4.3 → visual center 4.8, predominantly in col 4 (gap) — falls.
    expect(findSupportingSegment(row, 4.3)).toBeNull();
  });
});

describe('settle', () => {
  it('snaps player onto the row above the supporting line and clears falling', () => {
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 4.7, falling: true, velocityY: 6 });
    const { player: next, supporting } = settle(player, [row], 1234);
    expect(supporting).toBe(row);
    expect(next.falling).toBe(false);
    expect(next.y).toBe(4);
    expect(next.velocityY).toBe(0);
    expect(next.fellAtMs).toBeNull();
  });

  it('marks player as falling when no supporting row', () => {
    const row = makeRow(5, 0, 1);
    const player = makePlayer({ x: 5, y: 5 });
    const { player: next, supporting } = settle(player, [row], 1234);
    expect(supporting).toBeNull();
    expect(next.falling).toBe(true);
  });

  it('stamps fellAtMs and a takeoff drop velocity on the tick a player walks off', () => {
    const row = makeRow(5, 0, 1);
    const player = makePlayer({ x: 5, y: 5, falling: false, fellAtMs: null });
    const { player: next } = settle(player, [row], 999);
    expect(next.falling).toBe(true);
    expect(next.fellAtMs).toBe(999);
    expect(next.velocityY).toBeGreaterThan(0); // takeoff drop kick
  });

  it('does not re-stamp fellAtMs or re-kick velocityY while staying airborne', () => {
    const row = makeRow(5, 0, 1);
    const player = makePlayer({ x: 5, y: 5, falling: true, fellAtMs: 100, velocityY: 4 });
    const { player: next } = settle(player, [row], 1234);
    expect(next.fellAtMs).toBe(100);
    expect(next.velocityY).toBe(4); // preserved
  });

  it('passes through an overhead row while the jump is still rising (velocityY < 0)', () => {
    const row = makeRow(5, 0, 10);
    // Player rising, foot within the [0,1] catch range of `row` — but moving up.
    const player = makePlayer({ x: 5, y: 4.5, falling: true, velocityY: -3 });
    const { player: next, supporting } = settle(player, [row], 1234);
    expect(supporting).toBeNull();
    expect(next.falling).toBe(true);
    expect(next.y).toBe(4.5); // unchanged — not snapped
  });

  it('lands on the same overhead row once descending (velocityY >= 0)', () => {
    const row = makeRow(5, 0, 10);
    const player = makePlayer({ x: 5, y: 4.5, falling: true, velocityY: 1 });
    const { player: next, supporting } = settle(player, [row], 1234);
    expect(supporting).toBe(row);
    expect(next.falling).toBe(false);
    expect(next.y).toBe(4);
  });

  it('records groundY as the stand line of the row it lands on', () => {
    const row = makeRow(5, 0, 10);
    // groundY 5 → row's stand line (4) is exactly one cell up: an allowed hop.
    const player = makePlayer({ x: 5, y: 4.7, falling: true, velocityY: 6, groundY: 5 });
    const { player: next } = settle(player, [row], 1234);
    expect(next.groundY).toBe(4); // topRow - 1
  });
});

function makeProjectile(overrides: Partial<Projectile> = {}): Projectile {
  return {
    id: 'p-1',
    x: 70,
    y: 4,
    velocityX: -20,
    glyph: '◄',
    ...overrides,
  };
}

describe('advanceProjectile', () => {
  it('integrates velocityX into x', () => {
    const p = makeProjectile({ x: 70, velocityX: -20 });
    const next = advanceProjectile(p, 0.5);
    expect(next.x).toBeCloseTo(60);
  });

  it('preserves identity fields', () => {
    const p = makeProjectile();
    const next = advanceProjectile(p, 0.1);
    expect(next.id).toBe(p.id);
    expect(next.y).toBe(p.y);
    expect(next.glyph).toBe(p.glyph);
    expect(next.velocityX).toBe(p.velocityX);
  });
});

describe('projectileHitsPlatform', () => {
  it('hits when row.topRow matches projectile.y and cell is inside a segment', () => {
    const row = makeRow(5, 3, 7); // topRow=5, segment [3,7]
    const p = makeProjectile({ x: 5.2, y: 5 });
    const hit = projectileHitsPlatform(p, [row]);
    expect(hit).not.toBeNull();
    expect(hit?.cell).toBe(5);
    expect(hit?.row).toBe(row);
  });

  it('misses when cell is between segments on the matching row', () => {
    const row = makeRow(5, 3, 7);
    const p = makeProjectile({ x: 10, y: 5 });
    expect(projectileHitsPlatform(p, [row])).toBeNull();
  });

  it('ignores a platform that sits a full row above the projectile', () => {
    // Projectile flying at y=4, platform at y=5 (one row below). Even if the
    // cell aligns with the platform's segment, the missile is on a different
    // line and should not detonate.
    const row = makeRow(5, 0, 10);
    const p = makeProjectile({ x: 5, y: 4 });
    expect(projectileHitsPlatform(p, [row])).toBeNull();
  });

  it('ignores a platform that sits a full row below the projectile', () => {
    const row = makeRow(5, 0, 10);
    const p = makeProjectile({ x: 5, y: 6 });
    expect(projectileHitsPlatform(p, [row])).toBeNull();
  });

  it('returns the first row whose y matches and whose segment contains the cell', () => {
    const decoy = makeRow(8, 0, 10, 'decoy'); // wrong y
    const home = makeRow(5, 0, 10, 'home');
    const p = makeProjectile({ x: 5, y: 5 });
    const hit = projectileHitsPlatform(p, [decoy, home]);
    expect(hit?.row).toBe(home);
  });
});

describe('projectileHitsPlayer', () => {
  it('hits when both cells align and rows are within half a cell', () => {
    const p = makeProjectile({ x: 5.3, y: 4 });
    const player = makePlayer({ x: 5.1, y: 4 });
    expect(projectileHitsPlayer(p, player)).toBe(true);
  });

  it('misses when rows differ by half a cell or more', () => {
    const p = makeProjectile({ x: 5, y: 4 });
    const player = makePlayer({ x: 5, y: 4.5 });
    expect(projectileHitsPlayer(p, player)).toBe(false);
  });

  it('misses when columns are adjacent but not the same floored cell', () => {
    const p = makeProjectile({ x: 5.9, y: 4 });
    const player = makePlayer({ x: 6.0, y: 4 });
    expect(projectileHitsPlayer(p, player)).toBe(false);
  });

  it('still hits a dashing or airborne player', () => {
    const p = makeProjectile({ x: 5, y: 4 });
    const dashing = makePlayer({ x: 5, y: 4, dashRemainingMs: 100, dashDirection: 'left' });
    expect(projectileHitsPlayer(p, dashing)).toBe(true);
    const airborne = makePlayer({ x: 5, y: 4, falling: true, velocityY: 5 });
    expect(projectileHitsPlayer(p, airborne)).toBe(true);
  });
});
