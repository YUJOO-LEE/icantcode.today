import {
  COYOTE_TIME_MS,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  DASH_HORIZONTAL_CELLS_PER_SEC,
  PLAYER_GRAVITY_CELLS_PER_SEC,
  PLAYER_JUMP_VELOCITY_CELLS_PER_SEC,
  PLAYER_MOVE_CELLS_PER_SEC,
  PLAYER_TAKEOFF_DROP_CELLS_PER_SEC,
} from './constants';
import type {
  DashDirection,
  InputState,
  PlatformSegment,
  Player,
  Projectile,
  ScreenRow,
  Viewport,
} from './types';

export function clampX(x: number, cols: number): number {
  if (cols <= 0) return 0;
  return Math.max(0, Math.min(cols - 1, x));
}

function inSegment(x: number, segment: PlatformSegment): boolean {
  return x >= segment.startX && x <= segment.endX;
}

/**
 * Returns the row currently under the player's feet, or null when in the air.
 * The player stands one cell above the row's text — spec §A.3 says the
 * character "lands on the line above the topmost row of a group". So we
 * support when `row.topRow - player.y` is in `[0, 1]`, then snap the
 * player to `row.topRow - 1` (see `settle`).
 *
 * While airborne, a row whose stand line (`topRow - 1`) sits more than one
 * cell above the last grounded line (`player.groundY`) is ignored: a single
 * jump only rises ~1 cell, so without this the apex of a jump can "grab" a
 * platform two text-rows up and yank the player onto it.
 */
export function findSupportingRow(player: Player, rows: readonly ScreenRow[]): ScreenRow | null {
  const px = Math.floor(player.x);
  for (const row of rows) {
    const dy = row.topRow - player.y;
    if (dy < 0 || dy > 1) continue;
    if (player.falling && row.topRow < player.groundY - 0.5) continue;
    for (const seg of row.segments) {
      if (inSegment(px, seg)) return row;
    }
  }
  return null;
}

/** Returns the segment of `row` that holds the player's x, or null. */
export function findSupportingSegment(row: ScreenRow, x: number): PlatformSegment | null {
  const px = Math.floor(x);
  for (const seg of row.segments) {
    if (inSegment(px, seg)) return seg;
  }
  return null;
}

export function inputDirection(input: InputState): -1 | 0 | 1 {
  if (input === 'left') return -1;
  if (input === 'right') return 1;
  return 0; // 'none' or 'both' (cancel out)
}

/**
 * Apply one tick of vertical motion. Standing players (`falling=false`) hold
 * velocityY at 0; airborne players accumulate gravity.
 */
export function applyGravity(player: Player, dt: number): Player {
  if (!player.falling) return { ...player, velocityY: 0 };
  return {
    ...player,
    y: player.y + player.velocityY * dt,
    velocityY: player.velocityY + PLAYER_GRAVITY_CELLS_PER_SEC * dt,
  };
}

function dashHorizontalSign(dir: DashDirection): -1 | 1 {
  return dir === 'left' ? -1 : 1;
}

/**
 * Apply one tick of horizontal motion. While dashing, the dash drives x at
 * `DASH_HORIZONTAL_CELLS_PER_SEC`; otherwise the regular walk speed applies.
 */
export function applyHorizontal(player: Player, input: InputState, dt: number, cols: number): Player {
  if (player.dashRemainingMs > 0 && player.dashDirection !== null) {
    const dashDir = dashHorizontalSign(player.dashDirection);
    const nextX = clampX(player.x + dashDir * DASH_HORIZONTAL_CELLS_PER_SEC * dt, cols);
    return { ...player, x: nextX, input };
  }
  const dir = inputDirection(input);
  if (dir === 0) return { ...player, input };
  const nextX = clampX(player.x + dir * PLAYER_MOVE_CELLS_PER_SEC * dt, cols);
  return { ...player, x: nextX, input };
}

/**
 * Decide whether the player can act on a fresh jump request right now —
 * standing on a platform, or within the coyote-time grace period after
 * first transitioning to airborne.
 */
export function canJump(player: Player, elapsedMs: number): boolean {
  if (!player.falling) return true;
  if (player.fellAtMs === null) return false;
  return elapsedMs - player.fellAtMs <= COYOTE_TIME_MS;
}

/**
 * Fire a jump: set upward velocity and clear `fellAtMs` so a coyote jump
 * can't be re-used after landing-and-falling within the same window.
 */
export function applyJump(player: Player): Player {
  return {
    ...player,
    falling: true,
    velocityY: -PLAYER_JUMP_VELOCITY_CELLS_PER_SEC,
    fellAtMs: null,
  };
}

/**
 * Decide the dash direction from the held arrow key. Returns `null` when no
 * arrow is held (or both are) — pressing the dash key then does nothing.
 * Wall-clamping is handled by the regular horizontal clamp; the burst just
 * fizzles against an edge.
 */
export function pickDashDirection(player: Player): DashDirection | null {
  const horizontal = inputDirection(player.input);
  if (horizontal === -1) return 'left';
  if (horizontal === 1) return 'right';
  return null;
}

/**
 * A new dash can start only if a direction is held, no dash is active, and the
 * cooldown has expired.
 */
export function canDash(player: Player): boolean {
  if (player.dashRemainingMs > 0 || player.dashCooldownMs > 0) return false;
  return pickDashDirection(player) !== null;
}

/** Fire a dash for `DASH_DURATION_MS` in `direction`. */
export function applyDash(player: Player, direction: DashDirection): Player {
  return {
    ...player,
    dashRemainingMs: DASH_DURATION_MS,
    dashCooldownMs: DASH_COOLDOWN_MS,
    dashDirection: direction,
  };
}

/**
 * Tick down the dash duration / cooldown counters by `dtMs`. When the active
 * dash expires, clear `dashDirection`. Cooldown continues counting down even
 * after the dash itself has ended.
 */
export function tickDashTimers(player: Player, dtMs: number): Player {
  const nextRemaining = Math.max(0, player.dashRemainingMs - dtMs);
  const nextCooldown = Math.max(0, player.dashCooldownMs - dtMs);
  const nextDirection = nextRemaining > 0 ? player.dashDirection : null;
  return {
    ...player,
    dashRemainingMs: nextRemaining,
    dashCooldownMs: nextCooldown,
    dashDirection: nextDirection,
  };
}

/**
 * If the player is standing on a segment that has shrunk past their position,
 * snap them back onto the segment. Used when dynamic platforms shrink.
 */
export function autoSlide(player: Player, segment: PlatformSegment): Player {
  const px = Math.floor(player.x);
  if (px > segment.endX) return { ...player, x: segment.endX };
  if (px < segment.startX) return { ...player, x: segment.startX };
  return player;
}

export function detectDeath(player: Player, viewport: Viewport): 'segfault' | 'timeout' | null {
  if (player.y < 0) return 'timeout';
  if (player.y >= viewport.rows) return 'segfault';
  return null;
}

/** Apply one tick of horizontal motion to a projectile. */
export function advanceProjectile(p: Projectile, dt: number): Projectile {
  return { ...p, x: p.x + p.velocityX * dt };
}

/**
 * Detonates when the projectile's cell crosses a platform segment that shares
 * its row line (|row.topRow - p.y| < 0.5). Only platforms on the exact same
 * line block it — a platform sitting one row above or below the projectile
 * trail is irrelevant, which matches the visual ("the missile flew through
 * the empty space above that platform, not into it").
 */
export function projectileHitsPlatform(
  p: Projectile,
  rows: readonly ScreenRow[],
): { row: ScreenRow; cell: number } | null {
  const cell = Math.floor(p.x);
  for (const row of rows) {
    if (Math.abs(row.topRow - p.y) >= 0.5) continue;
    for (const seg of row.segments) {
      if (inSegment(cell, seg)) return { row, cell };
    }
  }
  return null;
}

/**
 * Direct hit against the player. We treat both entities as inhabiting a single
 * cell: hit when the rounded cells align and the rows are within half a cell.
 * That tolerance is enough to catch projectiles passing through the player at
 * any practical velocity given the 50ms frame cap (worst case ≈ 2 cells/frame
 * at PROJECTILE_VELOCITY_MAX, so per-tick alignment misses are negligible at
 * the resolution of `Math.floor`).
 */
export function projectileHitsPlayer(p: Projectile, player: Player): boolean {
  if (Math.abs(p.y - player.y) >= 0.5) return false;
  return Math.floor(p.x) === Math.floor(player.x);
}

/**
 * After scrolling rows and applying gravity, check whether the player is now
 * supported. Returns the updated player (snapped to platform y) and the
 * supporting row (null if still in the air).
 *
 * Side-effects on player state:
 *   - landing: snaps y, clears velocityY and fellAtMs, records groundY.
 *   - takeoff (was supported, now not): stamps fellAtMs and a takeoff drop
 *     velocity so the fall reads as a real fall right away (without the
 *     kick, line-scroll keeps the player inside `dy ∈ [0, 1]` long enough
 *     for a quickly-returning input to "climb back on" from below).
 *   - mid-air or staying-airborne ticks pass through unchanged.
 */
export function settle(
  player: Player,
  rows: readonly ScreenRow[],
  elapsedMs: number,
): { player: Player; supporting: ScreenRow | null } {
  // While a jump is still rising (velocityY < 0), don't snap onto platforms
  // overhead — pass through them. Landing is only resolved on the way down.
  // This keeps the jump a visible 1-cell arc and stops the apex from "grabbing"
  // a platform two text-rows above the launch line.
  if (player.falling && player.velocityY < 0) {
    return { player, supporting: null };
  }
  const supporting = findSupportingRow(player, rows);
  if (!supporting) {
    if (!player.falling) {
      return {
        player: {
          ...player,
          falling: true,
          fellAtMs: elapsedMs,
          velocityY: PLAYER_TAKEOFF_DROP_CELLS_PER_SEC,
        },
        supporting: null,
      };
    }
    return { player: { ...player, falling: true }, supporting: null };
  }
  return {
    player: {
      ...player,
      y: supporting.topRow - 1,
      falling: false,
      velocityY: 0,
      fellAtMs: null,
      groundY: supporting.topRow - 1,
    },
    supporting,
  };
}
