import { describe, it, expect } from 'vitest';
import {
  currentLinesPerSec,
  levelFromElapsed,
  makeInitialState,
  startNewRun,
  tickGameState,
  setPlayerInput,
} from '../gameState';
import { LEVEL_MAX, LINE_RATE_MAX, PLAYER_GRAVITY_CELLS_PER_SEC } from '../constants';
import { mulberry32 } from '../rng';

const VIEWPORT = { rows: 25, cols: 80 };

// Floating point comparison helper — LINE_RATE_BASE + LINE_RATE_STEP * level
// can produce values like 1.1, 1.2 that round-trip through JS doubles.
function approx(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

describe('levelFromElapsed', () => {
  it('starts at level 0', () => {
    expect(levelFromElapsed(0)).toBe(0);
    expect(levelFromElapsed(9_999)).toBe(0);
  });
  it('advances one level per 10s', () => {
    expect(levelFromElapsed(10_000)).toBe(1);
    expect(levelFromElapsed(19_999)).toBe(1);
    expect(levelFromElapsed(20_000)).toBe(2);
    expect(levelFromElapsed(50_000)).toBe(5);
    expect(levelFromElapsed(110_000)).toBe(11);
  });
  it('caps at LEVEL_MAX', () => {
    expect(LEVEL_MAX).toBe(12);
    expect(levelFromElapsed(120_000)).toBe(LEVEL_MAX);
    expect(levelFromElapsed(10 * 60_000)).toBe(LEVEL_MAX);
  });
});

describe('currentLinesPerSec', () => {
  it('returns the base rate at the start', () => {
    expect(currentLinesPerSec(0)).toBe(1.0);
  });
  it('follows the discrete ease-in table — early bumps already > +0.1', () => {
    // First step is +0.12 — bigger than the previous flat +0.1 curve so the
    // very first level-up is perceptibly faster.
    expect(approx(currentLinesPerSec(10_000), 1.12)).toBe(true);
    expect(approx(currentLinesPerSec(20_000), 1.25)).toBe(true);
    expect(approx(currentLinesPerSec(30_000), 1.4)).toBe(true);
    expect(approx(currentLinesPerSec(60_000), 1.94)).toBe(true);
  });
  it('keeps accelerating past 60s — late game punishes the player', () => {
    expect(approx(currentLinesPerSec(80_000), 2.4)).toBe(true);
    expect(approx(currentLinesPerSec(100_000), 2.94)).toBe(true);
    expect(approx(currentLinesPerSec(110_000), 3.24)).toBe(true);
  });
  it('caps at 3.5 line/sec once 120s has elapsed', () => {
    expect(currentLinesPerSec(120_000)).toBe(3.5);
    expect(currentLinesPerSec(180_000)).toBe(3.5);
    expect(currentLinesPerSec(600_000)).toBe(3.5);
  });

  it('keeps LINE_RATE_MAX strictly below PLAYER_GRAVITY_CELLS_PER_SEC (game-balance invariant)', () => {
    // If lines scrolled up faster than the player falls, the player on a
    // platform could never reach a lower platform — the game would become
    // unwinnable past the cap. Lock this in so future curve tweaks can't
    // accidentally violate it.
    expect(LINE_RATE_MAX).toBeLessThan(PLAYER_GRAVITY_CELLS_PER_SEC);
  });
});

describe('tickGameState', () => {
  it('returns same state when not playing', () => {
    const state = makeInitialState(VIEWPORT);
    const next = tickGameState(state, 16);
    expect(next).toBe(state);
  });

  it('advances elapsedMs while playing', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0);
    const next = tickGameState(state, 16, mulberry32(1));
    expect(next.elapsedMs).toBe(16);
  });

  it('eventually spawns the first row after the grace period', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    const rng = mulberry32(2);
    for (let i = 0; i < 60; i++) state = tickGameState(state, 16, rng);
    expect(state.rows.length).toBeGreaterThan(0);
  });

  it('detects timeout when player y goes above 0', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, player: { ...state.player, y: -1, falling: false } };
    state = tickGameState(state, 16, mulberry32(3));
    expect(state.status).toBe('dead-timeout');
  });

  it('detects segfault when player y exceeds rows', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = {
      ...state,
      player: { ...state.player, y: VIEWPORT.rows + 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(4));
    expect(state.status).toBe('dead-segfault');
  });
});

describe('setPlayerInput', () => {
  it('updates player input without changing other fields', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0);
    const next = setPlayerInput(state, 'left');
    expect(next.player.input).toBe('left');
    expect(next.elapsedMs).toBe(state.elapsedMs);
  });

  it('returns same state when input is unchanged', () => {
    const state = makeInitialState(VIEWPORT);
    expect(setPlayerInput(state, 'none')).toBe(state);
  });
});

describe('tickGameState — long runs', () => {
  it('spawns multiple lines + gaps over a few seconds without crashing', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    const rng = mulberry32(101);
    for (let i = 0; i < 600; i += 1) {
      state = tickGameState(state, 16, rng);
      if (state.status !== 'playing') break;
    }
    // The lineCounter must have grown — i.e. we hit the line-spawn branch
    // (gameState.ts:177-191) and the gap-spawn branch (194-202) at least once.
    expect(state.lineCounter).toBeGreaterThan(0);
    // At least one row in the live list at any point — covers the row map +
    // age + dynamic re-render branches.
    expect(state.rows.length).toBeGreaterThan(0);
  });

  it('updates score when the player lands on a supporting segment', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    const rng = mulberry32(202);
    // Pin the player onto whatever the first spawned platform is by holding
    // input='none' (no horizontal motion) and letting the simulation drop them
    // onto a platform row that scrolls into reach. Score is the deepest
    // lineNumber stepped on, so any positive score implies the supporting+seg
    // branch ran (gameState.ts:227-231).
    for (let i = 0; i < 1500; i += 1) {
      state = tickGameState(state, 16, rng);
      if (state.score > 0) break;
      if (state.status !== 'playing') {
        state = startNewRun(makeInitialState(VIEWPORT), 0);
      }
    }
    expect(state.score).toBeGreaterThan(0);
  });

  it('updates best when the player dies with a new high score', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, score: 17, best: 5 };
    state = {
      ...state,
      player: { ...state.player, y: VIEWPORT.rows + 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(303));
    expect(state.status).toBe('dead-segfault');
    expect(state.best).toBe(17);
  });

  it('keeps the existing best when the new score is lower', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, score: 3, best: 50 };
    state = {
      ...state,
      player: { ...state.player, y: VIEWPORT.rows + 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(404));
    expect(state.status).toBe('dead-segfault');
    expect(state.best).toBe(50);
  });

  it('marks the player as falling when settled on a row but no segment supports x', () => {
    // Hand-build a state that places the player exactly above a row whose
    // only segment is far away from x. settle() will report this row as
    // supporting (player.y is just above topRow), but findSupportingSegment
    // must return null → covers gameState.ts:140 + 233 (falling=true branch).
    const base = startNewRun(makeInitialState(VIEWPORT), 0);
    const row = {
      id: 'r-far',
      groupId: 'g',
      isLastOfGroup: true,
      lineIndex: 0,
      lineNumber: 7,
      source: null,
      text: 'xxx',
      // Segment is far away from where the player will be (x=40).
      segments: [{ startX: 0, endX: 2 }],
      topRow: 5,
      ageSec: 0,
    };
    const state = {
      ...base,
      rows: [row],
      player: { ...base.player, x: 40, y: 4.6, falling: true, input: 'none' as const },
    };
    const next = tickGameState(state, 16, mulberry32(505));
    // Player must still be flagged as falling — there's no segment under them.
    expect(next.player.falling).toBe(true);
    // Score must NOT have advanced past the row's lineNumber, because no
    // segment supported the player.
    expect(next.score).toBeLessThan(7);
  });

  it('detects timeout via tick when player y drifts above 0', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, player: { ...state.player, y: -2, falling: false } };
    state = tickGameState(state, 16, mulberry32(606));
    expect(state.status).toBe('dead-timeout');
  });
});

describe('tickGameState — level progression', () => {
  it('starts a fresh run at level 0 with no level-up stamp', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0);
    expect(state.level).toBe(0);
    expect(state.levelUpAtMs).toBe(0);
  });

  it('stamps levelUpAtMs the frame elapsed crosses a level boundary', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, elapsedMs: 9_990 };
    state = tickGameState(state, 16, mulberry32(700));
    // 9_990 + 16 = 10_006 → level 1
    expect(state.level).toBe(1);
    expect(state.levelUpAtMs).toBe(10_006);
  });

  it('does not retrigger levelUpAtMs on subsequent same-level frames', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, elapsedMs: 9_990 };
    state = tickGameState(state, 16, mulberry32(701));
    const stampedAt = state.levelUpAtMs;
    state = tickGameState(state, 16, mulberry32(702));
    expect(state.level).toBe(1);
    expect(state.levelUpAtMs).toBe(stampedAt);
  });

  it('stops stamping past the cap', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    // Jump just before the cap; the next tick crosses 0 → LEVEL_MAX in one
    // frame and stamps. Subsequent ticks must not re-stamp.
    state = { ...state, elapsedMs: 120_000 - 16 };
    state = tickGameState(state, 16, mulberry32(703));
    expect(state.level).toBe(LEVEL_MAX);
    const firstCapStamp = state.levelUpAtMs;
    expect(firstCapStamp).toBeGreaterThan(0);
    state = tickGameState(state, 16, mulberry32(704));
    expect(state.level).toBe(LEVEL_MAX);
    expect(state.levelUpAtMs).toBe(firstCapStamp);
  });
});
