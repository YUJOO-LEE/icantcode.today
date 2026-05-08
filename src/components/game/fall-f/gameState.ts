import { LINE_RATE, FIRST_LINE_DELAY_MS, SOLVABILITY } from './constants';
import { lineSegmentsAt, renderLine } from './dynamicLine';
import {
  applyGravity,
  applyHorizontal,
  autoSlide,
  detectDeath,
  settle,
} from './physics';
import { pickNextGroup } from './solvability';
import type {
  GameState,
  GameStatus,
  LineGroup,
  Line,
  PlatformSegment,
  Player,
  ScreenRow,
  Viewport,
} from './types';
import { defaultRNG, type RNG } from './rng';

export const GAP_GROUP_ID = '__gap';

export function currentLinesPerSec(elapsedMs: number): number {
  if (elapsedMs <= LINE_RATE.phase1.untilMs) return LINE_RATE.phase1.linesPerSec;
  if (elapsedMs <= LINE_RATE.phase2.untilMs) return LINE_RATE.phase2.linesPerSec;
  return LINE_RATE.phase3.linesPerSec;
}

function freshPlayer(viewport: Viewport): Player {
  return {
    x: Math.floor(viewport.cols / 2),
    y: 0,
    falling: true,
    input: 'none',
  };
}

export function makeInitialState(viewport: Viewport): GameState {
  return {
    status: 'idle',
    startedAtMs: 0,
    elapsedMs: 0,
    score: 0,
    best: 0,
    player: freshPlayer(viewport),
    rows: [],
    viewport,
    spawnPendingMs: FIRST_LINE_DELAY_MS,
    currentGroup: null,
    currentGroupCursor: 0,
    gapRowsRemaining: 0,
    recentGroups: [],
    lineCounter: 0,
  };
}

export function startNewRun(state: GameState, nowMs: number): GameState {
  return {
    ...state,
    status: 'playing',
    startedAtMs: nowMs,
    elapsedMs: 0,
    score: 0,
    rows: [],
    player: freshPlayer(state.viewport),
    spawnPendingMs: FIRST_LINE_DELAY_MS,
    currentGroup: null,
    currentGroupCursor: 0,
    gapRowsRemaining: 0,
    recentGroups: [],
    lineCounter: 0,
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

function findSupportingSegment(row: ScreenRow, x: number): PlatformSegment | null {
  const px = Math.floor(x);
  for (const seg of row.segments) {
    if (px >= seg.startX && px <= seg.endX) return seg;
  }
  return null;
}

export function tickGameState(state: GameState, dtMs: number, rng: RNG = defaultRNG): GameState {
  if (state.status !== 'playing') return state;
  const dt = dtMs / 1000;
  const elapsedMs = state.elapsedMs + dtMs;
  const linesPerSec = currentLinesPerSec(elapsedMs);
  const cols = state.viewport.cols;

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

  // 5. Player horizontal + gravity.
  let player = applyHorizontal(next.player, next.player.input, dt, next.viewport.cols);
  player = applyGravity(player, dt);

  // 6. Settle on supporting row, and track the deepest line stepped on.
  const settled = settle(player, next.rows);
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
