import {
  FIRST_LINE_DELAY_MS,
  LEVEL_DURATION_MS,
  LEVEL_MAX,
  LEVEL_RATES,
  PLAYER_SPAWN_X,
  SOLVABILITY,
} from './constants';
import { lineSegmentsAt, renderLine } from './dynamicLine';
import {
  applyDash,
  applyDashVertical,
  applyGravity,
  applyHorizontal,
  applyJump,
  autoSlide,
  canDash,
  canJump,
  detectDeath,
  findSupportingSegment,
  settle,
  tickDashTimers,
} from './physics';
import { pickNextGroup } from './solvability';
import type {
  GameState,
  GameStatus,
  LineGroup,
  Line,
  Player,
  ScreenRow,
  Viewport,
} from './types';
import { defaultRNG, type RNG } from './rng';

export const GAP_GROUP_ID = '__gap';

export function levelFromElapsed(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.min(LEVEL_MAX, Math.floor(elapsedMs / LEVEL_DURATION_MS));
}

export function currentLinesPerSec(elapsedMs: number): number {
  // `levelFromElapsed` clamps to [0, LEVEL_MAX] so the lookup is always
  // defined; the fallback is a TS-narrowing crutch, not a real runtime path.
  return LEVEL_RATES[levelFromElapsed(elapsedMs)] ?? LEVEL_RATES[0];
}

// Spawn at (PLAYER_SPAWN_X, 1):
//   - x: most platforms start at column 0 and rarely reach past the middle
//     of the viewport, so the firstPick filter in `solvability.ts` pairs
//     with this column to guarantee a no-input landing.
//   - y: with line-scroll applied to airborne players, y=0 would dip below
//     zero on the first tick and trigger a timeout death before gravity
//     has had a chance to ramp up; y=1 gives just enough headroom.
// Shared reference is safe because every tick produces a new player via
// `{ ...player, ... }` — the initial object is never mutated in place.
const INITIAL_PLAYER: Player = {
  x: PLAYER_SPAWN_X,
  y: 1,
  falling: true,
  input: 'none',
  velocityY: 0,
  fellAtMs: null,
  dashRemainingMs: 0,
  dashCooldownMs: 0,
  dashDirection: null,
};

export function makeInitialState(viewport: Viewport): GameState {
  return {
    status: 'idle',
    startedAtMs: 0,
    elapsedMs: 0,
    score: 0,
    best: 0,
    player: INITIAL_PLAYER,
    rows: [],
    viewport,
    spawnPendingMs: FIRST_LINE_DELAY_MS,
    currentGroup: null,
    currentGroupCursor: 0,
    gapRowsRemaining: 0,
    recentGroups: [],
    lineCounter: 0,
    level: 0,
    levelUpAtMs: 0,
    pendingJump: false,
    pendingDash: false,
  };
}

export function startNewRun(state: GameState, nowMs: number): GameState {
  return {
    ...makeInitialState(state.viewport),
    best: state.best,
    status: 'playing',
    startedAtMs: nowMs,
  };
}

let rowIdCounter = 0;
function makeRowId(prefix: string): string {
  rowIdCounter += 1;
  return `${prefix}-${rowIdCounter}`;
}

function makeLineRow(
  group: LineGroup,
  lineIndex: number,
  bottomRow: number,
  lineNumber: number,
  cols: number,
): ScreenRow {
  const source = group.lines[lineIndex] as Line;
  const text = renderLine(source, 0, cols);
  const segments = lineSegmentsAt(source, 0, cols);
  return {
    id: makeRowId(group.id),
    groupId: group.id,
    isLastOfGroup: false,
    lineIndex,
    lineNumber,
    source,
    text,
    segments,
    topRow: bottomRow,
    ageSec: 0,
  };
}

function makeGapRow(bottomRow: number, isLast: boolean, lineNumber: number): ScreenRow {
  return {
    id: makeRowId('gap'),
    groupId: GAP_GROUP_ID,
    isLastOfGroup: isLast,
    lineIndex: -1,
    lineNumber,
    source: null,
    text: '',
    segments: [],
    topRow: bottomRow,
    ageSec: 0,
  };
}

function pushRecent(history: LineGroup[], group: LineGroup): LineGroup[] {
  const next = [...history, group];
  const cap = SOLVABILITY.shortLineRunCap + 1;
  return next.length > cap ? next.slice(-cap) : next;
}

function rerenderDynamicRow(row: ScreenRow, cols: number): ScreenRow {
  if (!row.source || row.source.kind === 'static') return row;
  const text = renderLine(row.source, row.ageSec, cols);
  const segments = lineSegmentsAt(row.source, row.ageSec, cols);
  return { ...row, text, segments };
}

export function tickGameState(state: GameState, dtMs: number, rng: RNG = defaultRNG): GameState {
  if (state.status !== 'playing') return state;
  const dt = dtMs / 1000;
  const elapsedMs = state.elapsedMs + dtMs;
  const linesPerSec = currentLinesPerSec(elapsedMs);
  const cols = state.viewport.cols;

  // Difficulty bumps every LEVEL_DURATION_MS. Stamping `levelUpAtMs` here
  // keeps the FX trigger purely a function of game state — GameField just
  // checks whether the stamp is still within the FX window.
  const nextLevel = levelFromElapsed(elapsedMs);
  const leveledUp = nextLevel > state.level;
  const levelUpAtMs = leveledUp ? elapsedMs : state.levelUpAtMs;

  // 1. Scroll rows up.
  let rows: ScreenRow[] = state.rows.map((r) => ({
    ...r,
    topRow: r.topRow - linesPerSec * dt,
    ageSec: r.ageSec + dt,
  }));

  // 2. Re-render dynamic lines (rendered text changes with age).
  rows = rows.map((r) => rerenderDynamicRow(r, cols));

  // 3. Drop rows that scrolled off the top. (Score is the deepest line the
  //    player has stepped on, not the count of lines passed — see step 6.)
  rows = rows.filter((r) => r.topRow >= -0.5);

  // 4. Spawn new rows on a tick budget.
  const next: GameState = {
    ...state,
    elapsedMs,
    level: nextLevel,
    levelUpAtMs,
    rows,
    spawnPendingMs: state.spawnPendingMs - dtMs,
  };
  const bottomRow = next.viewport.rows;
  let safety = 8;
  while (next.spawnPendingMs <= 0 && safety > 0) {
    safety -= 1;

    if (next.currentGroup && next.currentGroupCursor < next.currentGroup.lines.length) {
      next.lineCounter += 1;
      const row = makeLineRow(
        next.currentGroup,
        next.currentGroupCursor,
        bottomRow,
        next.lineCounter,
        cols,
      );
      next.rows = next.rows.concat(row);
      next.currentGroupCursor += 1;
      if (next.currentGroupCursor >= next.currentGroup.lines.length) {
        next.gapRowsRemaining = next.currentGroup.gap;
      }
      next.spawnPendingMs += 1000 / linesPerSec;
      continue;
    }

    if (next.gapRowsRemaining > 0) {
      const isLast = next.gapRowsRemaining === 1;
      next.lineCounter += 1;
      const row = makeGapRow(bottomRow, isLast, next.lineCounter);
      next.rows = next.rows.concat(row);
      next.gapRowsRemaining -= 1;
      next.spawnPendingMs += 1000 / linesPerSec;
      continue;
    }

    // Need to pick the next group; does not consume the spawn budget.
    const picked = pickNextGroup(
      {
        recentGroups: next.recentGroups,
        cols: next.viewport.cols,
        firstPick: next.recentGroups.length === 0,
      },
      rng,
    );
    next.currentGroup = picked;
    next.currentGroupCursor = 0;
    next.gapRowsRemaining = 0;
    next.recentGroups = pushRecent(next.recentGroups, picked);
  }

  // 5. Player physics. Airborne players scroll with the map so jump arcs
  //    return to the launching platform at any line-rate; on the ground,
  //    `settle` re-snaps every tick so the scroll has no visible effect.
  let player: Player = next.player.falling
    ? { ...next.player, y: next.player.y - linesPerSec * dt }
    : next.player;
  if (next.pendingJump && canJump(player, elapsedMs)) {
    player = applyJump(player);
  }
  if (next.pendingDash && canDash(player)) {
    player = applyDash(player);
  }
  next.pendingJump = false;
  next.pendingDash = false;
  player = tickDashTimers(player, dtMs);
  player = applyHorizontal(player, player.input, dt, next.viewport.cols);
  player = applyGravity(player, dt);
  player = applyDashVertical(player, dt);

  // 6. Settle on supporting row, and track the deepest line stepped on.
  const settled = settle(player, next.rows, elapsedMs);
  player = settled.player;
  if (settled.supporting) {
    const seg = findSupportingSegment(settled.supporting, player.x);
    if (seg) {
      player = autoSlide(player, seg);
      const ln = settled.supporting.lineNumber;
      if (ln > next.score) next.score = ln;
    } else {
      player = { ...player, falling: true };
    }
  }
  next.player = player;

  // 7. Death detection.
  let nextStatus: GameStatus = next.status;
  const death = detectDeath(player, next.viewport);
  if (death === 'segfault') nextStatus = 'dead-segfault';
  else if (death === 'timeout') nextStatus = 'dead-timeout';

  if (nextStatus !== state.status) {
    next.status = nextStatus;
    if (next.score > next.best) next.best = next.score;
  }

  return next;
}

export function setPlayerInput(state: GameState, input: Player['input']): GameState {
  if (state.player.input === input) return state;
  return { ...state, player: { ...state.player, input } };
}

/** Queue a one-shot jump request for the next `tickGameState`. */
export function requestJump(state: GameState): GameState {
  if (state.pendingJump) return state;
  return { ...state, pendingJump: true };
}

/** Queue a one-shot dash request for the next `tickGameState`. */
export function requestDash(state: GameState): GameState {
  if (state.pendingDash) return state;
  return { ...state, pendingDash: true };
}
