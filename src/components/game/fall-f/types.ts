export type Cell = number;

export interface PlatformSegment {
  startX: Cell;
  endX: Cell;
}

export interface StaticLine {
  kind: 'static';
  text: string;
}

/**
 * Growing line: starts at `initial` and appends `growChar` over time at
 * `growPerSec` chars/second. Used for "loading…" lines that fill up to span
 * the row, leaving the player no gap to fall through if they stay too long.
 */
export interface GrowRightLine {
  kind: 'grow-right';
  initial: string;
  growChar: string;
  growPerSec: number;
}

/**
 * Oscillating progress bar: bracketed cell that fills and empties on a
 * triangular wave. `periodSec` is one full cycle (full → empty → full).
 */
export interface FillRightLine {
  kind: 'fill-right';
  initial: string;
  periodSec: number;
  filled: string;
  empty: string;
}

export type Line = StaticLine | GrowRightLine | FillRightLine;

export interface LineGroup {
  id: string;
  lines: Line[];
  gap: 1 | 2;
}

export type InputState = 'none' | 'left' | 'right' | 'both';

export interface Player {
  x: Cell;
  y: number;
  falling: boolean;
  input: InputState;
}

export interface Viewport {
  rows: number;
  cols: number;
}

export type GameStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'dead-segfault'
  | 'dead-timeout'
  | 'dead-resize';

export interface RenderedLine {
  text: string;
  segments: PlatformSegment[];
}

/**
 * One on-screen row. Each visible line of a group is its own ScreenRow.
 * Gap rows have empty segments, `groupId === '__gap'`, and `lineNumber === 0`.
 */
export interface ScreenRow {
  id: string;
  groupId: string;
  isLastOfGroup: boolean;
  lineIndex: number;
  /** 1-based ordinal of this line since the run started; 0 for gap rows. */
  lineNumber: number;
  source: Line | null;
  text: string;
  segments: PlatformSegment[];
  topRow: number;
  ageSec: number;
}

/** Backward-compatible alias used by physics tests. */
export type GroupRow = ScreenRow;

export interface GameState {
  status: GameStatus;
  startedAtMs: number;
  elapsedMs: number;
  /** Highest line number the player has actually stepped on (0 if none). */
  score: number;
  best: number;
  player: Player;
  rows: ScreenRow[];
  viewport: Viewport;
  spawnPendingMs: number;
  currentGroup: LineGroup | null;
  currentGroupCursor: number;
  gapRowsRemaining: number;
  recentGroups: LineGroup[];
  /** Total non-gap lines spawned in this run; used to assign lineNumber. */
  lineCounter: number;
}
