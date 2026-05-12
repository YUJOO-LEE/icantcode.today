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

/**
 * Active dash direction. Dash never has an upward component — jump is the only
 * upward action. Direction is decided purely by the held arrow key:
 * left/right → horizontal; nothing held → straight down. Hitting walls is
 * handled by the regular horizontal clamp.
 */
export type DashDirection = 'left' | 'right' | 'down';

export interface Player {
  x: Cell;
  y: number;
  falling: boolean;
  input: InputState;
  /** Vertical velocity in cells/sec. Negative = moving up (during a jump). */
  velocityY: number;
  /**
   * Timestamp (in elapsedMs) at which the player transitioned into `falling`.
   * `null` while supported. Drives the coyote-time grace period for late jumps.
   */
  fellAtMs: number | null;
  /** > 0 while a dash is still active. */
  dashRemainingMs: number;
  /** > 0 while the player cannot start a new dash. */
  dashCooldownMs: number;
  /** Direction vector of the active dash; `null` when not dashing. */
  dashDirection: DashDirection | null;
}

export interface Viewport {
  rows: number;
  cols: number;
}

export type GameStatus =
  | 'idle'
  | 'starting'
  | 'start-failed'
  | 'playing'
  | 'paused'
  | 'dead-segfault'
  | 'dead-timeout'
  | 'dead-resize';

/**
 * One on-screen row. Each visible line of a group is its own ScreenRow.
 * Gap rows have empty segments and `groupId === '__gap'`. They still occupy
 * a position in the running line counter — terminals number every line,
 * blank or not — so the gutter shows a number for them too.
 */
export interface ScreenRow {
  id: string;
  groupId: string;
  isLastOfGroup: boolean;
  lineIndex: number;
  /** 1-based ordinal of this row since the run started, including gap rows. */
  lineNumber: number;
  source: Line | null;
  text: string;
  segments: PlatformSegment[];
  topRow: number;
  ageSec: number;
}

export interface GameState {
  status: GameStatus;
  /** Server-issued one-shot session id from POST /games/start. Required to submit a score. */
  sessionId: string | null;
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
  /** Discrete difficulty step. floor(elapsedMs / LEVEL_DURATION_MS), clamped to LEVEL_MAX. */
  level: number;
  /** elapsedMs at which `level` last advanced; 0 means never. Drives the brief level-up FX. */
  levelUpAtMs: number;
  /** One-shot jump request consumed (and reset) by the next tick. */
  pendingJump: boolean;
  /** One-shot dash request consumed (and reset) by the next tick. */
  pendingDash: boolean;
}
