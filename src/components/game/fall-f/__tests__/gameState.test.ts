import { describe, it, expect } from 'vitest';
import {
  currentLinesPerSec,
  levelFromElapsed,
  makeInitialState,
  requestDash,
  requestJump,
  startNewRun,
  tickGameState,
  setPlayerInput,
} from '../gameState';
import {
  COYOTE_TIME_MS,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  EXPLOSION_DURATION_MS,
  LEVEL_MAX,
  LINE_RATE_MAX,
  PLAYER_GRAVITY_CELLS_PER_SEC,
  PLAYER_JUMP_VELOCITY_CELLS_PER_SEC,
  PROJECTILE_GLYPH,
  PROJECTILE_SPAWN_THRESHOLD_SCORE,
  PROJECTILE_TELEGRAPH_MS,
} from '../constants';
import { mulberry32 } from '../rng';
import type { ScreenRow } from '../types';

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
    expect(LEVEL_MAX).toBe(20);
    expect(levelFromElapsed(200_000)).toBe(LEVEL_MAX);
    expect(levelFromElapsed(10 * 60_000)).toBe(LEVEL_MAX);
  });
});

describe('currentLinesPerSec', () => {
  it('returns the base rate at the start', () => {
    expect(currentLinesPerSec(0)).toBe(1.0);
  });
  it('opens fast — the first level-up alone clears +0.25 line/sec', () => {
    // The pre-tune curve started with +0.12, which made the first minute
    // feel like idle drift. The new +0.25 / +0.30 opening gets pressure
    // going right away.
    expect(approx(currentLinesPerSec(10_000), 1.25)).toBe(true);
    expect(approx(currentLinesPerSec(20_000), 1.55)).toBe(true);
    expect(approx(currentLinesPerSec(30_000), 1.85)).toBe(true);
    expect(approx(currentLinesPerSec(60_000), 2.75)).toBe(true);
  });
  it('keeps accelerating past 60s — late game punishes the player', () => {
    expect(approx(currentLinesPerSec(80_000), 3.4)).toBe(true);
    expect(approx(currentLinesPerSec(100_000), 4.1)).toBe(true);
    expect(approx(currentLinesPerSec(110_000), 4.5)).toBe(true);
  });
  it('continues climbing past 120s with even larger steps', () => {
    expect(currentLinesPerSec(120_000)).toBe(4.95);
    expect(currentLinesPerSec(150_000)).toBe(6.55);
    expect(currentLinesPerSec(180_000)).toBe(8.15);
  });
  it('caps at 8.9 line/sec once 200s has elapsed', () => {
    expect(currentLinesPerSec(200_000)).toBe(8.9);
    expect(currentLinesPerSec(300_000)).toBe(8.9);
    expect(currentLinesPerSec(600_000)).toBe(8.9);
  });

  it('keeps LINE_RATE_MAX strictly below PLAYER_GRAVITY_CELLS_PER_SEC (game-balance invariant)', () => {
    // If lines scrolled up faster than the player falls, the player on a
    // platform could never reach a lower platform — the game would become
    // unwinnable past the cap. Lock this in so future curve tweaks can't
    // accidentally violate it.
    expect(LINE_RATE_MAX).toBeLessThan(PLAYER_GRAVITY_CELLS_PER_SEC);
  });

  it('lets a player jump from a mid-screen platform without timing out at LINE_RATE_MAX', () => {
    // Even when the scroll is at the cap, a single hop from a platform
    // sitting in the middle of the viewport must survive — the entire
    // jump arc costs ~2v/gravity = 0.667s, during which the player
    // scrolls 0.667 × LINE_RATE_MAX (= ~5.94 cells) closer to the top
    // edge. A platform at y = viewport.rows/2 still has rows headroom.
    // Without this guard the difficulty curve could regress us into an
    // unwinnable opening tick after a jump.
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Jump from a platform in the middle of the viewport, at the post-cap
    // elapsed time so the scroll rate is at LINE_RATE_MAX.
    const platformTop = Math.floor(VIEWPORT.rows / 2);
    state = {
      ...state,
      elapsedMs: 200_000,
      level: LEVEL_MAX,
      rows: [makeRow({ id: 'r-mid', topRow: platformTop, lineNumber: 5 })],
      player: {
        ...state.player,
        x: 2,
        y: platformTop - 1,
        falling: false,
        velocityY: 0,
        fellAtMs: null,
        groundY: platformTop - 1,
      },
    };
    state = requestJump(state);
    const rng = mulberry32(1234);
    // Simulate ~1 second of motion — covers the full ~0.667s arc.
    for (let i = 0; i < 60; i += 1) {
      state = tickGameState(state, 16, rng);
      expect(state.status, `died at tick ${i} (status=${state.status})`).toBe('playing');
    }
  });
});

describe('tickGameState', () => {
  it('returns same state when not playing', () => {
    const state = makeInitialState(VIEWPORT);
    const next = tickGameState(state, 16);
    expect(next).toBe(state);
  });

  it('advances elapsedMs while playing', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    const next = tickGameState(state, 16, mulberry32(1));
    expect(next.elapsedMs).toBe(16);
  });

  it('eventually spawns the first row after the grace period', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    const rng = mulberry32(2);
    for (let i = 0; i < 60; i++) state = tickGameState(state, 16, rng);
    expect(state.rows.length).toBeGreaterThan(0);
  });

  it('detects timeout when player y goes above 0', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = { ...state, player: { ...state.player, y: -1, falling: false } };
    state = tickGameState(state, 16, mulberry32(3));
    expect(state.status).toBe('dead-timeout');
  });

  it('detects segfault when player y exceeds rows', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
    const state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
        state = startNewRun(makeInitialState(VIEWPORT), 0, null);
      }
    }
    expect(state.score).toBeGreaterThan(0);
  });

  it('updates best when the player dies with a new high score', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
    const base = startNewRun(makeInitialState(VIEWPORT), 0, null);
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
      contentOffsetX: 0,
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
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = { ...state, player: { ...state.player, y: -2, falling: false } };
    state = tickGameState(state, 16, mulberry32(606));
    expect(state.status).toBe('dead-timeout');
  });
});

describe('requestJump / requestDash', () => {
  it('flips pendingJump and is idempotent', () => {
    const state = makeInitialState(VIEWPORT);
    const once = requestJump(state);
    expect(once.pendingJump).toBe(true);
    expect(requestJump(once)).toBe(once); // already true → no churn
  });

  it('flips pendingDash and is idempotent', () => {
    const state = makeInitialState(VIEWPORT);
    const once = requestDash(state);
    expect(once.pendingDash).toBe(true);
    expect(requestDash(once)).toBe(once);
  });
});

describe('tickGameState — jump', () => {
  it('applies upward velocity to a supported player and clears the request', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      player: { ...state.player, falling: false, velocityY: 0 },
    };
    state = requestJump(state);
    state = tickGameState(state, 16, mulberry32(801));
    expect(state.pendingJump).toBe(false);
    // After one tick the velocity has been integrated by gravity once,
    // so it sits between -PLAYER_JUMP_VELOCITY_CELLS_PER_SEC and zero.
    expect(state.player.velocityY).toBeLessThan(0);
    expect(state.player.velocityY).toBeGreaterThan(-PLAYER_JUMP_VELOCITY_CELLS_PER_SEC);
    expect(state.player.falling).toBe(true);
  });

  it('drops the request when the player is airborne past coyote time', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      player: { ...state.player, falling: true, fellAtMs: 0 },
      elapsedMs: COYOTE_TIME_MS + 50,
    };
    state = requestJump(state);
    state = tickGameState(state, 16, mulberry32(802));
    expect(state.pendingJump).toBe(false);
    // velocityY only got the regular gravity tick — no -PLAYER_JUMP_VELOCITY kick.
    expect(state.player.velocityY).toBeGreaterThan(0);
  });

  it('honors a coyote jump within the grace window', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      player: { ...state.player, falling: true, fellAtMs: 0, velocityY: 1 },
      elapsedMs: COYOTE_TIME_MS - 20,
    };
    state = requestJump(state);
    state = tickGameState(state, 16, mulberry32(803));
    // Negative velocity means the jump kicked in.
    expect(state.player.velocityY).toBeLessThan(0);
    expect(state.player.fellAtMs).toBeNull();
  });
});

describe('tickGameState — dash', () => {
  it('starts a dash burst and clears the request', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = setPlayerInput(state, 'right');
    state = requestDash(state);
    state = tickGameState(state, 16, mulberry32(901));
    expect(state.pendingDash).toBe(false);
    // 16ms of the burst has been consumed already; the rest is still ticking.
    expect(state.player.dashRemainingMs).toBe(DASH_DURATION_MS - 16);
    expect(state.player.dashCooldownMs).toBe(DASH_COOLDOWN_MS - 16);
    expect(state.player.dashDirection).toBe('right'); // pure horizontal regardless of falling
  });

  it('rejects a dash while cooldown is active', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = setPlayerInput(state, 'right');
    state = requestDash(state);
    state = tickGameState(state, 16, mulberry32(902));
    // Now request a second dash immediately — cooldown should still be active.
    state = requestDash(state);
    const beforeRemaining = state.player.dashRemainingMs;
    state = tickGameState(state, 16, mulberry32(903));
    // dashRemainingMs is just decreasing, never reset to DASH_DURATION_MS.
    expect(state.player.dashRemainingMs).toBeLessThan(beforeRemaining);
  });

  it('clears dashDirection once the burst ends', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = setPlayerInput(state, 'right');
    state = requestDash(state);
    // Tick enough to exceed DASH_DURATION_MS in one step.
    state = tickGameState(state, DASH_DURATION_MS + 50, mulberry32(904));
    expect(state.player.dashRemainingMs).toBe(0);
    expect(state.player.dashDirection).toBeNull();
  });

  it('ignores a dash request when no direction is held', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // input stays 'none' — dash key alone must do nothing.
    state = requestDash(state);
    state = tickGameState(state, 16, mulberry32(905));
    expect(state.pendingDash).toBe(false);
    expect(state.player.dashRemainingMs).toBe(0);
    expect(state.player.dashDirection).toBeNull();
  });
});

describe('tickGameState — level progression', () => {
  it('starts a fresh run at level 0 with no level-up stamp', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    expect(state.level).toBe(0);
    expect(state.levelUpAtMs).toBe(0);
  });

  it('stamps levelUpAtMs the frame elapsed crosses a level boundary', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = { ...state, elapsedMs: 9_990 };
    state = tickGameState(state, 16, mulberry32(700));
    // 9_990 + 16 = 10_006 → level 1
    expect(state.level).toBe(1);
    expect(state.levelUpAtMs).toBe(10_006);
  });

  it('does not retrigger levelUpAtMs on subsequent same-level frames', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = { ...state, elapsedMs: 9_990 };
    state = tickGameState(state, 16, mulberry32(701));
    const stampedAt = state.levelUpAtMs;
    state = tickGameState(state, 16, mulberry32(702));
    expect(state.level).toBe(1);
    expect(state.levelUpAtMs).toBe(stampedAt);
  });

  it('stops stamping past the cap', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Jump just before the cap; the next tick crosses LEVEL_MAX-1 → LEVEL_MAX
    // in one frame and stamps. Subsequent ticks must not re-stamp.
    state = { ...state, elapsedMs: 200_000 - 16 };
    state = tickGameState(state, 16, mulberry32(703));
    expect(state.level).toBe(LEVEL_MAX);
    const firstCapStamp = state.levelUpAtMs;
    expect(firstCapStamp).toBeGreaterThan(0);
    state = tickGameState(state, 16, mulberry32(704));
    expect(state.level).toBe(LEVEL_MAX);
    expect(state.levelUpAtMs).toBe(firstCapStamp);
  });
});

function makeRow(overrides: Partial<ScreenRow> & { id: string; topRow: number }): ScreenRow {
  return {
    groupId: 'g',
    isLastOfGroup: true,
    lineIndex: 0,
    lineNumber: 1,
    source: null,
    text: 'xxxxx',
    segments: [{ startX: 0, endX: 5 }],
    ageSec: 0,
    contentOffsetX: 0,
    ...overrides,
  };
}

describe('tickGameState — projectile spawn gating', () => {
  it('never spawns telegraphs or projectiles while score < threshold', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = { ...state, score: PROJECTILE_SPAWN_THRESHOLD_SCORE - 1 };
    // Seed a visible platform row so the spawner has a target if it were to run.
    state = {
      ...state,
      rows: [makeRow({ id: 'r-1', topRow: 10, lineNumber: 5 })],
    };
    const rng = mulberry32(11);
    for (let i = 0; i < 600; i += 1) {
      state = tickGameState(state, 16, rng);
      // Keep the score pinned just below threshold across ticks.
      if (state.score >= PROJECTILE_SPAWN_THRESHOLD_SCORE) {
        state = { ...state, score: PROJECTILE_SPAWN_THRESHOLD_SCORE - 1 };
      }
      if (state.status !== 'playing') break;
    }
    expect(state.telegraphs).toEqual([]);
    expect(state.projectiles).toEqual([]);
  });

  it('eventually spawns at least one telegraph (or projectile) once score >= threshold', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      score: PROJECTILE_SPAWN_THRESHOLD_SCORE,
      // Generous row coverage so picks always succeed.
      rows: [
        makeRow({ id: 'r-a', topRow: 5, lineNumber: 5 }),
        makeRow({ id: 'r-b', topRow: 12, lineNumber: 6 }),
        makeRow({ id: 'r-c', topRow: 18, lineNumber: 7 }),
      ],
    };
    const rng = mulberry32(22);
    let saw = false;
    for (let i = 0; i < 800; i += 1) {
      state = tickGameState(state, 16, rng);
      if (state.telegraphs.length > 0 || state.projectiles.length > 0) {
        saw = true;
        break;
      }
      if (state.status !== 'playing') break;
    }
    expect(saw).toBe(true);
  });
});

describe('tickGameState — projectile lifecycle', () => {
  it('promotes a telegraph to a projectile when its remaining time hits 0', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      rows: [makeRow({ id: 'r-host', topRow: 10, lineNumber: 5 })],
      telegraphs: [
        {
          id: 'tel-x',
          y: 9,
          remainingMs: 20,
          velocityX: -30,
        },
      ],
    };
    state = tickGameState(state, 30, mulberry32(33));
    expect(state.telegraphs).toEqual([]);
    expect(state.projectiles.length).toBe(1);
    expect(state.projectiles[0]?.glyph).toBe(PROJECTILE_GLYPH);
    expect(state.projectiles[0]?.velocityX).toBe(-30);
  });

  it('detonates the projectile when it shares y with a platform segment', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Projectile y matches row.topRow exactly — both scroll in lockstep so
    // they stay aligned through the tick. Cell falls inside segment [0,5].
    state = {
      ...state,
      rows: [makeRow({ id: 'r-host', topRow: 10, lineNumber: 5 })],
      projectiles: [
        {
          id: 'p-1',
          x: 2.4,
          y: 10,
          velocityX: -1,
          glyph: PROJECTILE_GLYPH,
        },
      ],
      // Move the player far away so the projectile doesn't kill them this tick.
      player: { ...state.player, x: 70, y: 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(44));
    expect(state.projectiles).toEqual([]);
    expect(state.explosions.length).toBe(1);
    expect(state.explosions[0]?.remainingMs).toBeLessThanOrEqual(EXPLOSION_DURATION_MS);
    expect(state.status).toBe('playing');
  });

  it('passes through when a platform sits on a different y from the projectile', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Projectile at y=9, platform at y=10 — visually the missile is flying
    // one row above the platform's stand-line. Must not detonate.
    state = {
      ...state,
      rows: [makeRow({ id: 'r-host', topRow: 10, lineNumber: 5 })],
      projectiles: [
        {
          id: 'p-1',
          x: 2.4,
          y: 9,
          velocityX: -1,
          glyph: PROJECTILE_GLYPH,
        },
      ],
      player: { ...state.player, x: 70, y: 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(444));
    expect(state.projectiles.length).toBe(1);
    expect(state.explosions).toEqual([]);
  });

  it('kills the player when a projectile lands on their cell', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Player is mid-air (no support); use a row whose segments are far from
    // the player so projectile cannot be blocked by the platform. Start the
    // projectile at x=10.5 so a 16ms tick of leftward motion still leaves
    // `floor(x)` aligned with the player's cell at x=10.
    state = {
      ...state,
      rows: [makeRow({ id: 'r-decoy', topRow: 20, lineNumber: 5, segments: [{ startX: 70, endX: 75 }] })],
      player: { ...state.player, x: 10, y: 5, falling: true, velocityY: 0 },
      projectiles: [
        {
          id: 'p-killer',
          x: 10.5,
          y: 5,
          velocityX: -1,
          glyph: PROJECTILE_GLYPH,
        },
      ],
    };
    state = tickGameState(state, 16, mulberry32(55));
    expect(state.status).toBe('dead-killed');
  });

  it('updates best when killed by projectile and score is a new high', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      score: 42,
      best: 10,
      rows: [makeRow({ id: 'r-decoy', topRow: 20, lineNumber: 5, segments: [{ startX: 70, endX: 75 }] })],
      player: { ...state.player, x: 10, y: 5, falling: true, velocityY: 0 },
      projectiles: [
        {
          id: 'p-killer',
          x: 10.5,
          y: 5,
          velocityX: -1,
          glyph: PROJECTILE_GLYPH,
        },
      ],
    };
    state = tickGameState(state, 16, mulberry32(56));
    expect(state.status).toBe('dead-killed');
    expect(state.best).toBe(42);
  });

  it('expires explosions after EXPLOSION_DURATION_MS', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      explosions: [
        { id: 'e-1', x: 5, y: 4, remainingMs: 50 },
      ],
    };
    state = tickGameState(state, 60, mulberry32(66));
    expect(state.explosions).toEqual([]);
  });

  it('is deterministic under the same seed and initial state', () => {
    function run(): { telegraphs: number; projectiles: number; explosions: number } {
      let s = startNewRun(makeInitialState(VIEWPORT), 0, null);
      s = {
        ...s,
        score: PROJECTILE_SPAWN_THRESHOLD_SCORE,
        rows: [
          makeRow({ id: 'r-a', topRow: 5, lineNumber: 5 }),
          makeRow({ id: 'r-b', topRow: 12, lineNumber: 6 }),
          makeRow({ id: 'r-c', topRow: 18, lineNumber: 7 }),
        ],
      };
      const rng = mulberry32(777);
      for (let i = 0; i < 400; i += 1) {
        s = tickGameState(s, 16, rng);
        if (s.status !== 'playing') break;
      }
      return {
        telegraphs: s.telegraphs.length,
        projectiles: s.projectiles.length,
        explosions: s.explosions.length,
      };
    }
    const a = run();
    const b = run();
    expect(a).toEqual(b);
  });

  it('PROJECTILE_TELEGRAPH_MS is a positive lead time', () => {
    // Anchors the contract for the visual telegraph in case the constant is
    // ever zeroed out by accident — without lead time the warning is useless.
    expect(PROJECTILE_TELEGRAPH_MS).toBeGreaterThan(0);
  });

  it('shortens the projectile spawn interval as score climbs', () => {
    function intervalAt(score: number): number {
      let s = startNewRun(makeInitialState(VIEWPORT), 0, null);
      s = {
        ...s,
        score,
        rows: [makeRow({ id: 'r-a', topRow: 12, lineNumber: 5 })],
        projectileSpawnTimerMs: 1, // about to trigger spawn this tick
      };
      // dt=2ms drains the 1ms timer, fires one telegraph, and reseeds the
      // timer with a fresh interval based on `score`.
      s = tickGameState(s, 2, mulberry32(900));
      return s.projectileSpawnTimerMs;
    }
    const atThreshold = intervalAt(PROJECTILE_SPAWN_THRESHOLD_SCORE);
    const deepRun = intervalAt(PROJECTILE_SPAWN_THRESHOLD_SCORE + 1000);
    expect(deepRun).toBeLessThan(atThreshold);
  });
});

describe('tickGameState — shifting platform drag', () => {
  it('drags the player horizontally by the row contentOffsetX delta', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    // Land the player on a row whose segment covers x=4.
    state = {
      ...state,
      rows: [
        makeRow({
          id: 'r-shift',
          topRow: 10,
          lineNumber: 5,
          segments: [{ startX: 2, endX: 6 }],
          contentOffsetX: 0,
        }),
      ],
      player: { ...state.player, x: 4, y: 9, falling: true, velocityY: 1 },
    };
    state = tickGameState(state, 16, mulberry32(700));
    expect(state.playerStanding?.rowId).toBe('r-shift');
    expect(state.playerStanding?.offsetX).toBe(0);
    const xBefore = state.player.x;

    // Hand-shift the platform by +1 cell. With source: null the rerender step
    // won't overwrite our shift back to 0, so we can isolate the drag logic.
    state = {
      ...state,
      rows: state.rows.map((r) =>
        r.id === 'r-shift'
          ? { ...r, contentOffsetX: 1, segments: [{ startX: 3, endX: 7 }] }
          : r,
      ),
    };
    state = tickGameState(state, 16, mulberry32(701));
    expect(state.player.x).toBeCloseTo(xBefore + 1, 5);
    expect(state.playerStanding?.offsetX).toBe(1);
  });

  it('clears playerStanding when the player leaves the platform', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0, null);
    state = {
      ...state,
      rows: [
        makeRow({
          id: 'r-floor',
          topRow: 10,
          lineNumber: 5,
          segments: [{ startX: 0, endX: 5 }],
        }),
      ],
      player: { ...state.player, x: 2, y: 9, falling: true, velocityY: 1 },
    };
    state = tickGameState(state, 16, mulberry32(702));
    expect(state.playerStanding).not.toBeNull();

    // Send the player far off the platform — supporting row is lost.
    state = {
      ...state,
      player: { ...state.player, x: 60, y: 20, falling: true },
      rows: [],
    };
    state = tickGameState(state, 16, mulberry32(703));
    expect(state.playerStanding).toBeNull();
  });
});
