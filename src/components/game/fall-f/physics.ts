import { PLAYER_GRAVITY_CELLS_PER_SEC, PLAYER_MOVE_CELLS_PER_SEC } from './constants';
import type { GroupRow, InputState, PlatformSegment, Player, Viewport } from './types';

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
 */
export function findSupportingRow(player: Player, rows: readonly GroupRow[]): GroupRow | null {
  const px = Math.floor(player.x);
  for (const row of rows) {
    const dy = row.topRow - player.y;
    if (dy < 0 || dy > 1) continue;
    for (const seg of row.segments) {
      if (inSegment(px, seg)) return row;
    }
  }
  return null;
}

export function applyGravity(player: Player, dt: number): Player {
  if (!player.falling) return player;
  return { ...player, y: player.y + PLAYER_GRAVITY_CELLS_PER_SEC * dt };
}

export function inputDirection(input: InputState): -1 | 0 | 1 {
  if (input === 'left') return -1;
  if (input === 'right') return 1;
  return 0; // 'none' or 'both' (cancel out)
}

export function applyHorizontal(player: Player, input: InputState, dt: number, cols: number): Player {
  const dir = inputDirection(input);
  if (dir === 0) return { ...player, input };
  const nextX = clampX(player.x + dir * PLAYER_MOVE_CELLS_PER_SEC * dt, cols);
  return { ...player, x: nextX, input };
}

/**
 * If the player is standing on a segment that has shrunk past their position,
 * snap them back onto the segment. Used when dynamic platforms shrink.
 */
export function autoSlide(player: Player, segment: PlatformSegment): Player {
  const px = Math.floor(player.x);
  if (px > segment.endX) {
    return { ...player, x: segment.endX };
  }
  if (px < segment.startX) {
    return { ...player, x: segment.startX };
  }
  return player;
}

export function detectDeath(player: Player, viewport: Viewport): 'segfault' | 'timeout' | null {
  if (player.y < 0) return 'timeout';
  if (player.y >= viewport.rows) return 'segfault';
  return null;
}

/**
 * After scrolling rows and applying gravity, check whether the player is now
 * supported. Returns the updated player (snapped to platform y) and the
 * supporting row (null if the player is still in the air).
 */
export function settle(
  player: Player,
  rows: readonly GroupRow[],
): { player: Player; supporting: GroupRow | null } {
  const supporting = findSupportingRow(player, rows);
  if (!supporting) {
    return { player: { ...player, falling: true }, supporting: null };
  }
  return {
    player: { ...player, y: supporting.topRow - 1, falling: false },
    supporting,
  };
}
