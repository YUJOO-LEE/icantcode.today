import {
  EXPLOSION_DURATION_MS,
  FIRST_LINE_DELAY_MS,
  LEVEL_DURATION_MS,
  LEVEL_MAX,
  LEVEL_RATES,
  PLAYER_SPAWN_X,
  PROJECTILE_GLYPH,
  PROJECTILE_SPAWN_INTERVAL_MAX_MS,
  PROJECTILE_SPAWN_INTERVAL_MIN_FACTOR,
  PROJECTILE_SPAWN_INTERVAL_MIN_MS,
  PROJECTILE_SPAWN_INTERVAL_RAMP_SCORE,
  PROJECTILE_SPAWN_THRESHOLD_SCORE,
  PROJECTILE_TELEGRAPH_MS,
  PROJECTILE_UPWARD_WEIGHT_FACTOR,
  PROJECTILE_VELOCITY_MAX_CELLS_PER_SEC,
  PROJECTILE_VELOCITY_MIN_CELLS_PER_SEC,
  PUSHER_LENGTH,
  PUSHER_SPAWN_INTERVAL_MAX_MS,
  PUSHER_SPAWN_INTERVAL_MIN_FACTOR,
  PUSHER_SPAWN_INTERVAL_MIN_MS,
  PUSHER_SPAWN_INTERVAL_RAMP_SCORE,
  PUSHER_SPAWN_THRESHOLD_SCORE,
  PUSHER_VELOCITY_MAX_CELLS_PER_SEC,
  PUSHER_VELOCITY_MIN_CELLS_PER_SEC,
  SOLVABILITY,
} from './constants';
import { lineContentOffsetX, lineSegmentsAt, renderLine } from './dynamicLine';
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
  findSupportingSegment,
  pickDashDirection,
  projectileHitsPlatform,
  projectileHitsPlayer,
  settle,
  tickDashTimers,
} from './physics';
import { pickNextGroup } from './solvability';
import type {
  Explosion,
  GameState,
  GameStatus,
  LineGroup,
  Line,
  Player,
  Projectile,
  Pusher,
  ScreenRow,
  Telegraph,
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
  groundY: Number.NEGATIVE_INFINITY,
  dashRemainingMs: 0,
  dashCooldownMs: 0,
  dashDirection: null,
};

export function makeInitialState(viewport: Viewport): GameState {
  return {
    status: 'idle',
    sessionId: null,
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
    telegraphs: [],
    projectiles: [],
    explosions: [],
    projectileSpawnTimerMs: 0,
    pushers: [],
    pusherSpawnTimerMs: 0,
    playerStanding: null,
  };
}

export function startNewRun(state: GameState, nowMs: number, sessionId: string | null): GameState {
  return {
    ...makeInitialState(state.viewport),
    best: state.best,
    status: 'playing',
    sessionId,
    startedAtMs: nowMs,
  };
}

let rowIdCounter = 0;
function makeRowId(prefix: string): string {
  rowIdCounter += 1;
  return `${prefix}-${rowIdCounter}`;
}

let projectileIdCounter = 0;
function makeProjectileId(): string {
  projectileIdCounter += 1;
  return `proj-${projectileIdCounter}`;
}

let telegraphIdCounter = 0;
function makeTelegraphId(): string {
  telegraphIdCounter += 1;
  return `tel-${telegraphIdCounter}`;
}

let explosionIdCounter = 0;
function makeExplosionId(): string {
  explosionIdCounter += 1;
  return `boom-${explosionIdCounter}`;
}

let pusherIdCounter = 0;
function makePusherId(): string {
  pusherIdCounter += 1;
  return `push-${pusherIdCounter}`;
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

/**
 * Random projectile spawn delay, shortened as the score climbs. Reaches its
 * floor (factor = PROJECTILE_SPAWN_INTERVAL_MIN_FACTOR of base length) at
 * score = threshold + RAMP_SCORE.
 */
function rolledSpawnIntervalMs(score: number, roll: number): number {
  const over = Math.max(0, score - PROJECTILE_SPAWN_THRESHOLD_SCORE);
  const t = Math.min(1, over / PROJECTILE_SPAWN_INTERVAL_RAMP_SCORE);
  const factor = lerp(1, PROJECTILE_SPAWN_INTERVAL_MIN_FACTOR, t);
  const base = lerp(PROJECTILE_SPAWN_INTERVAL_MIN_MS, PROJECTILE_SPAWN_INTERVAL_MAX_MS, roll);
  return factor * base;
}

/** Pusher analog of `rolledSpawnIntervalMs`. Separate threshold + ramp + cap. */
function rolledPusherIntervalMs(score: number, roll: number): number {
  const over = Math.max(0, score - PUSHER_SPAWN_THRESHOLD_SCORE);
  const t = Math.min(1, over / PUSHER_SPAWN_INTERVAL_RAMP_SCORE);
  const factor = lerp(1, PUSHER_SPAWN_INTERVAL_MIN_FACTOR, t);
  const base = lerp(PUSHER_SPAWN_INTERVAL_MIN_MS, PUSHER_SPAWN_INTERVAL_MAX_MS, roll);
  return factor * base;
}

/**
 * Pick a platform row to target for a new projectile telegraph. Returns null
 * when no eligible row exists (early game, or the screen is mostly gaps).
 *
 * Eligibility: non-gap, has at least one segment, fully inside the visible
 * area with a one-row margin so the right-edge telegraph isn't drawn on top
 * of the score HUD nor on a row about to scroll off.
 *
 * Weighted pick with two biases:
 *   1. distance — closer to player.y wins (1 / (1 + d))
 *   2. direction — rows above the player are scaled down by
 *      PROJECTILE_UPWARD_WEIGHT_FACTOR, because the run only ever progresses
 *      downward and an above-player missile is cosmetic. Without (2), half
 *      the missiles land where the player isn't going.
 *
 * Without (1) bottom-camping runs avoid most missiles; without (2) above-row
 * missiles look impressive but never threaten.
 */
/**
 * Pick a fully-empty (gap) row to spawn a pusher on. Returns null when no
 * gap row is currently visible. Eligibility:
 *   - groupId === GAP_GROUP_ID (the row is a deliberate inter-group spacer,
 *     guaranteeing no segments at any point in its life)
 *   - topRow inside the visible viewport with a top margin so the score HUD
 *     doesn't get overlapped at the spawn edge
 *
 * Selection is uniform random among eligible rows — pushers don't need the
 * distance/direction bias projectiles use because they always travel along
 * a confirmed-blank corridor and only become dangerous when the *player*
 * walks into them.
 */
function pickPusherTargetRow(
  rows: readonly ScreenRow[],
  viewport: Viewport,
  rng: RNG,
): ScreenRow | null {
  const candidates = rows.filter(
    (r) => r.groupId === GAP_GROUP_ID && r.topRow >= 1 && r.topRow < viewport.rows,
  );
  if (candidates.length === 0) return null;
  const idx = Math.floor(rng() * candidates.length);
  return candidates[Math.min(idx, candidates.length - 1)] ?? null;
}

function pickTelegraphTargetRow(
  rows: readonly ScreenRow[],
  viewport: Viewport,
  playerY: number,
  rng: RNG,
): ScreenRow | null {
  // Top margin (`topRow >= 1`) protects the score HUD from a telegraph dot
  // landing on top of it. No bottom margin: the lead time (PROJECTILE_TELEGRAPH_MS)
  // scrolls the row safely upward before the projectile launches, and the
  // projectile itself collides on y-alignment, not row presence — so even if
  // the row scrolls away the missile keeps flying.
  const candidates = rows.filter(
    (r) =>
      r.groupId !== GAP_GROUP_ID &&
      r.segments.length > 0 &&
      r.topRow >= 1 &&
      r.topRow < viewport.rows,
  );
  if (candidates.length === 0) return null;
  const weights = candidates.map((r) => {
    const standY = r.topRow - 1;
    const signed = standY - playerY;
    const distance = Math.abs(signed);
    const direction = signed < 0 ? PROJECTILE_UPWARD_WEIGHT_FACTOR : 1;
    return direction / (1 + distance);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return candidates[i] ?? null;
  }
  return candidates[candidates.length - 1] ?? null;
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
  const contentOffsetX = lineContentOffsetX(source, 0, cols);
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
    contentOffsetX,
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
    contentOffsetX: 0,
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
  const contentOffsetX = lineContentOffsetX(row.source, row.ageSec, cols);
  return { ...row, text, segments, contentOffsetX };
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
  //    `groundY` scrolls alongside `y` so the "max 1 cell of climb" cap stays
  //    aligned with the platforms (which also scroll) for the whole arc.
  const scroll = linesPerSec * dt;
  let player: Player = next.player.falling
    ? { ...next.player, y: next.player.y - scroll, groundY: next.player.groundY - scroll }
    : next.player;
  if (next.pendingJump && canJump(player, elapsedMs)) {
    player = applyJump(player);
  }
  if (next.pendingDash && canDash(player)) {
    const dir = pickDashDirection(player);
    if (dir) player = applyDash(player, dir);
  }
  next.pendingJump = false;
  next.pendingDash = false;
  player = tickDashTimers(player, dtMs);
  player = applyHorizontal(player, player.input, dt, next.viewport.cols);
  player = applyGravity(player, dt);

  // 5.5 Pusher motion + push effect. Pushers exist on fully empty (gap)
  //     rows; their `y` matches the stand-line of the platform immediately
  //     below the gap, so they only ever touch players who are *grounded
  //     on that platform*. A jumping player rises one cell above the
  //     stand-line, clearing the pusher for the duration of the arc.
  //     Push is applied BEFORE settle so a player shoved past the right
  //     edge of the platform falls on the same tick they're shoved.
  let pushers: Pusher[] = next.pushers.map((p) => ({
    ...p,
    x: p.x + p.velocityX * dt,
    y: p.y - scroll,
  }));
  if (!player.falling) {
    for (const p of pushers) {
      if (Math.abs(p.y - player.y) >= 0.5) continue;
      const leading = Math.round(p.x);
      const trailing = leading - PUSHER_LENGTH + 1;
      const foot = Math.round(player.x);
      if (foot >= trailing && foot <= leading) {
        player = { ...player, x: clampX(player.x + p.velocityX * dt, cols) };
        break;
      }
    }
  }

  // 6. Settle on supporting row, and track the deepest line stepped on.
  const settled = settle(player, next.rows, elapsedMs);
  player = settled.player;
  if (settled.supporting) {
    const supporting = settled.supporting;
    // Shifting-platform drag: same row as last tick → carry the player by
    // the delta of the row's contentOffsetX so the platform doesn't slide
    // out from under them.
    const prevStanding = next.playerStanding;
    if (prevStanding && prevStanding.rowId === supporting.id) {
      const delta = supporting.contentOffsetX - prevStanding.offsetX;
      if (delta !== 0) {
        player = { ...player, x: clampX(player.x + delta, cols) };
      }
    }
    next.playerStanding = { rowId: supporting.id, offsetX: supporting.contentOffsetX };
    const seg = findSupportingSegment(supporting, player.x);
    if (seg) {
      player = autoSlide(player, seg);
      const ln = supporting.lineNumber;
      if (ln > next.score) next.score = ln;
    } else {
      player = { ...player, falling: true };
      next.playerStanding = null;
    }
  } else {
    next.playerStanding = null;
  }
  next.player = player;

  // 7. Projectile lifecycle. Scroll → telegraph countdown → spawn projectiles
  //    → projectile motion → platform detonation → player hit detection →
  //    expiry/offscreen cleanup → new telegraph spawn (gated on score).
  let telegraphs: Telegraph[] = next.telegraphs.map((t) => ({ ...t, y: t.y - scroll }));
  let projectiles: Projectile[] = next.projectiles.map((p) => ({ ...p, y: p.y - scroll }));
  let explosions: Explosion[] = next.explosions.map((e) => ({ ...e, y: e.y - scroll }));

  const tickedTelegraphs: Telegraph[] = [];
  const newlySpawned: Projectile[] = [];
  for (const t of telegraphs) {
    const remaining = t.remainingMs - dtMs;
    if (remaining <= 0) {
      newlySpawned.push({
        id: makeProjectileId(),
        x: cols - 1,
        y: t.y,
        velocityX: t.velocityX,
        glyph: PROJECTILE_GLYPH,
      });
    } else {
      tickedTelegraphs.push({ ...t, remainingMs: remaining });
    }
  }
  telegraphs = tickedTelegraphs;
  projectiles = projectiles.concat(newlySpawned).map((p) => advanceProjectile(p, dt));

  // Platform detonation. A projectile whose rounded cell lands on a segment
  // of its origin row becomes a short-lived explosion and is removed.
  const survivingProjectiles: Projectile[] = [];
  for (const p of projectiles) {
    const hit = projectileHitsPlatform(p, next.rows);
    if (hit) {
      explosions = explosions.concat({
        id: makeExplosionId(),
        x: hit.cell,
        y: p.y,
        remainingMs: EXPLOSION_DURATION_MS,
      });
    } else {
      survivingProjectiles.push(p);
    }
  }
  projectiles = survivingProjectiles;

  // Pusher ↔ Projectile mutual annihilation. Happens BEFORE the
  // projectileHitsPlayer check so a missile intercepted by a pusher can't
  // also kill the player on the same tick.
  {
    const pushersHit = new Set<string>();
    const projsHit = new Set<string>();
    for (const proj of projectiles) {
      for (const p of pushers) {
        if (pushersHit.has(p.id)) continue;
        if (Math.abs(p.y - proj.y) >= 0.5) continue;
        const leading = Math.round(p.x);
        const trailing = leading - PUSHER_LENGTH + 1;
        const projCell = Math.floor(proj.x);
        if (projCell >= trailing && projCell <= leading) {
          explosions = explosions.concat({
            id: makeExplosionId(),
            x: projCell,
            y: proj.y,
            remainingMs: EXPLOSION_DURATION_MS,
          });
          pushersHit.add(p.id);
          projsHit.add(proj.id);
          break;
        }
      }
    }
    if (pushersHit.size > 0) pushers = pushers.filter((p) => !pushersHit.has(p.id));
    if (projsHit.size > 0) projectiles = projectiles.filter((p) => !projsHit.has(p.id));
  }

  let killedByProjectile = false;
  for (const p of projectiles) {
    if (projectileHitsPlayer(p, player)) {
      killedByProjectile = true;
      break;
    }
  }

  explosions = explosions
    .map((e) => ({ ...e, remainingMs: e.remainingMs - dtMs }))
    .filter((e) => e.remainingMs > 0 && e.y >= -0.5 && e.y < next.viewport.rows);
  projectiles = projectiles.filter(
    (p) => p.x >= -0.5 && p.y >= -0.5 && p.y < next.viewport.rows,
  );
  telegraphs = telegraphs.filter((t) => t.y >= -0.5 && t.y < next.viewport.rows);

  let spawnTimerMs = next.projectileSpawnTimerMs;
  if (next.score >= PROJECTILE_SPAWN_THRESHOLD_SCORE) {
    spawnTimerMs -= dtMs;
    // `while` over `if` so a long frame can still drain multiple intervals,
    // matching the spawn-budget pattern in step 4.
    let spawnSafety = 4;
    while (spawnTimerMs <= 0 && spawnSafety > 0) {
      spawnSafety -= 1;
      const target = pickTelegraphTargetRow(next.rows, next.viewport, player.y, rng);
      if (target) {
        const speed = lerp(
          PROJECTILE_VELOCITY_MIN_CELLS_PER_SEC,
          PROJECTILE_VELOCITY_MAX_CELLS_PER_SEC,
          rng(),
        );
        telegraphs = telegraphs.concat({
          id: makeTelegraphId(),
          y: target.topRow - 1,
          remainingMs: PROJECTILE_TELEGRAPH_MS,
          velocityX: -speed,
        });
      }
      spawnTimerMs += rolledSpawnIntervalMs(next.score, rng());
    }
  }

  next.telegraphs = telegraphs;
  next.projectiles = projectiles;

  // 7.6 Pusher cleanup + spawn (gated on PUSHER_SPAWN_THRESHOLD_SCORE).
  pushers = pushers.filter((p) => {
    if (p.y < -0.5 || p.y >= next.viewport.rows) return false;
    // Despawn once the trailing edge has scrolled past the right wall.
    const trailing = Math.round(p.x) - PUSHER_LENGTH + 1;
    return trailing < cols;
  });
  let pusherTimerMs = next.pusherSpawnTimerMs;
  if (next.score >= PUSHER_SPAWN_THRESHOLD_SCORE) {
    pusherTimerMs -= dtMs;
    let pusherSafety = 4;
    while (pusherTimerMs <= 0 && pusherSafety > 0) {
      pusherSafety -= 1;
      const target = pickPusherTargetRow(next.rows, next.viewport, rng);
      if (target) {
        const speed = lerp(
          PUSHER_VELOCITY_MIN_CELLS_PER_SEC,
          PUSHER_VELOCITY_MAX_CELLS_PER_SEC,
          rng(),
        );
        pushers = pushers.concat({
          id: makePusherId(),
          // Leading cell at 0 → only the leading `)` is visible at spawn;
          // the trailing two cells emerge as the body slides right.
          x: 0,
          // p.y = gap.topRow lines up with the stand-line of the platform
          // directly below the gap (whose topRow = gap.topRow + 1, so its
          // stand-line is exactly gap.topRow).
          y: target.topRow,
          velocityX: speed,
        });
      }
      pusherTimerMs += rolledPusherIntervalMs(next.score, rng());
    }
  }
  next.pushers = pushers;
  next.pusherSpawnTimerMs = pusherTimerMs;

  next.explosions = explosions;
  next.projectileSpawnTimerMs = spawnTimerMs;

  // 8. Death detection. Projectile hit overrides the y-bounds checks because
  //    a missile can land on a player who's still well inside the viewport.
  let nextStatus: GameStatus = next.status;
  if (killedByProjectile) {
    nextStatus = 'dead-killed';
  } else {
    const death = detectDeath(player, next.viewport);
    if (death === 'segfault') nextStatus = 'dead-segfault';
    else if (death === 'timeout') nextStatus = 'dead-timeout';
  }

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
