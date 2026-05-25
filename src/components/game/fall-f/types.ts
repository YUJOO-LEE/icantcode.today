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

/**
 * Toggles between two fixed patterns every `periodSec`. Used for "flickering"
 * platforms that look like a stable row but periodically swap which cells are
 * solid — the player has to move before the next flip drops them. RNG-free:
 * the toggle is purely a function of `ageSec`, so seeded replays are stable.
 */
export interface AlternatingLine {
  kind: 'alternating';
  patternA: string;
  patternB: string;
  /** Seconds each pattern stays solid before flipping to the other. */
  periodSec: number;
}

/** Ping-pongs left/right one cell per `periodSec`. Players riding it are dragged along. */
export interface ShiftingLine {
  kind: 'shifting';
  pattern: string;
  periodSec: number;
  initialDirection: -1 | 1;
}

export type Line = StaticLine | GrowRightLine | FillRightLine | AlternatingLine | ShiftingLine;

export interface LineGroup {
  id: string;
  lines: Line[];
  gap: 1 | 2;
}

export type InputState = 'none' | 'left' | 'right' | 'both';

/**
 * Active dash direction. Dash is horizontal-only: the direction is the held
 * arrow key (left/right). With no arrow held, pressing the dash key does
 * nothing — there is no down/up dash. Hitting walls is handled by the regular
 * horizontal clamp.
 */
export type DashDirection = 'left' | 'right';

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
  /**
   * Stand-line y of the platform the player last stood on, kept in current
   * screen coordinates (scrolled with the map while airborne). A single jump
   * only rises ~1 cell, so while airborne the player must never be "grabbed"
   * upward onto a platform whose stand line is more than 1 cell above this.
   * `-Infinity` before the first landing so the initial drop can't be capped.
   */
  groundY: number;
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
  | 'dead-killed'
  | 'dead-resize';

/**
 * Telegraphed warning marker that precedes a projectile by
 * PROJECTILE_TELEGRAPH_MS. Drawn as a blinking dot at the right edge of the
 * row whose stand-line the projectile will sweep.
 */
export interface Telegraph {
  id: string;
  /** Y in screen-space at the moment the telegraph spawned. Scrolls with the map. */
  y: number;
  /** Counts down to 0; at zero the projectile spawns and the telegraph is removed. */
  remainingMs: number;
  /** Pre-rolled velocity (cells/sec, negative for right→left) so timing stays tied to spawn. */
  velocityX: number;
}

/**
 * Right-to-left hazard that sweeps across a row. Kills the player on direct
 * hit; "detonates" (turns into an Explosion) the moment its rounded cell
 * enters a platform segment that occupies the same y. Platforms that sit a
 * row above/below the projectile do not block it — only platforms on the
 * exact same line.
 */
export interface Projectile {
  id: string;
  x: number;
  y: number;
  /** cells/sec, negative for right→left. */
  velocityX: number;
  glyph: string;
}

/**
 * Short-lived visual that replaces a projectile when it hits a platform cell.
 * Pure cosmetic — has no collision and disappears after EXPLOSION_DURATION_MS.
 */
export interface Explosion {
  id: string;
  x: number;
  y: number;
  remainingMs: number;
}

/**
 * Left-to-right hazard that only spawns on fully-empty (gap) rows. Drags any
 * grounded player whose foot cell overlaps the pusher body rightward at the
 * pusher's velocity until the player jumps clear, the pusher hits a missile
 * (mutual annihilation), or the pusher reaches the right edge. The "body"
 * is `PUSHER_LENGTH` cells wide; `x` is the leading (rightmost) cell.
 */
export interface Pusher {
  id: string;
  /** Leading-edge column (rightmost cell of the body). */
  x: number;
  y: number;
  /** cells/sec, positive (left→right). */
  velocityX: number;
}

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
  /** Cell-offset from a shifting source line. 0 for everything else. */
  contentOffsetX: number;
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
  /** Pending right→left telegraphs. Each spawns a Projectile when remainingMs hits 0. */
  telegraphs: Telegraph[];
  /** In-flight horizontal hazards. */
  projectiles: Projectile[];
  /** Cosmetic explosion marks after a projectile detonates on a platform. */
  explosions: Explosion[];
  /** Ms until the next telegraph spawn. Only ticks down once score ≥ threshold. */
  projectileSpawnTimerMs: number;
  /** Active left-to-right pushers (gap-row only). */
  pushers: Pusher[];
  /** Ms until the next pusher spawn. Only ticks down once score ≥ pusher threshold. */
  pusherSpawnTimerMs: number;
  /** Tracks the player's standing row + its offsetX at contact; delta drives shifting-platform drag. */
  playerStanding: { rowId: string; offsetX: number } | null;
}
