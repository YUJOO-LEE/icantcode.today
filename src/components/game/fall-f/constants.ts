// Tags: [SPEC] = directly from FALL_F.md §A.
//       [TUNING] = author-suggested starting value, adjust freely.

// [SPEC §A.3] Progressive line-rate curve — discrete 21-step ease-in.
// Each step advances every LEVEL_DURATION_MS. The increments themselves
// grow over time (≈ +0.12 → +0.85 line/sec) so early bumps are already
// perceptible while the cap (≈ 8.9 line/sec, ~9× base) only arrives at
// the 200s mark — i.e. genuinely punishing late-game pace.
//
// Game-balance invariant: LINE_RATE_MAX MUST stay strictly below
// PLAYER_GRAVITY_CELLS_PER_SEC. If lines scroll up faster than the player
// falls, a player standing on a platform can no longer reach a lower
// platform and the game becomes unwinnable past the cap. Enforced by a
// unit test in `__tests__/gameState.test.ts`.
export const LEVEL_DURATION_MS = 10_000;
export const LEVEL_RATES = [
  1.0, // L0  — 0–10s
  1.12, // L1  — 10–20s
  1.25, // L2  — 20–30s
  1.4, // L3  — 30–40s
  1.56, // L4  — 40–50s
  1.74, // L5  — 50–60s
  1.94, // L6  — 60–70s
  2.16, // L7  — 70–80s
  2.4, // L8  — 80–90s
  2.66, // L9  — 90–100s
  2.94, // L10 — 100–110s
  3.24, // L11 — 110–120s
  3.5, // L12 — 120–130s
  4.0, // L13 — 130–140s
  4.55, // L14 — 140–150s
  5.15, // L15 — 150–160s
  5.8, // L16 — 160–170s
  6.5, // L17 — 170–180s
  7.25, // L18 — 180–190s
  8.05, // L19 — 190–200s
  8.9, // L20+ — 200s and beyond (cap)
] as const;
export const LEVEL_MAX = LEVEL_RATES.length - 1;
export const LINE_RATE_MAX = LEVEL_RATES[LEVEL_MAX];

// [TUNING] How long the brief level-up visual feedback lingers after each
// difficulty bump. Must stay well under LEVEL_DURATION_MS so successive
// triggers never overlap.
export const LEVEL_UP_FX_DURATION_MS = 1_000;

export const PRESSURE_GROUP_RATIO = 0.15; // [TUNING] spec §A.9 says 10–20%

// Aligned to Tailwind v4 `text-xs` line-height (16px), the size used by most
// of the site's components. Spec §A.8 listed ~24px as an approximation.
export const ROW_HEIGHT_PX = 16;

// Left gutter of the playfield used to render the line-number column
// alongside each row, plus a small breathing gap from the wall indicator.
export const FIELD_GUTTER_LEFT_PX = 32;

// Right-side breathing room between the rightmost cell and the field edge.
export const FIELD_GUTTER_RIGHT_PX = 8;

export const FIRST_LINE_DELAY_MS = 500; // [SPEC §A.5] approximate

// [TUNING] Player downward acceleration. Higher = faster falls and a higher
// LINE_RATE_MAX ceiling (the invariant LINE_RATE_MAX < gravity must hold).
// Always paired with PLAYER_JUMP_VELOCITY_CELLS_PER_SEC = sqrt(2·gravity)
// so the jump-apex rise stays at exactly 1 cell regardless of how this is
// tuned.
export const PLAYER_GRAVITY_CELLS_PER_SEC = 18;
export const PLAYER_MOVE_CELLS_PER_SEC = 12; // [TUNING]

// [TUNING] Spawn column. The very first picked platform is constrained to
// have a segment that covers this column (see `solvability.ts`), so the
// player drops straight onto it without input.
export const PLAYER_SPAWN_X = 1;

// [TUNING] Jump initial upward velocity. Tuned so that v² = 2·gravity, which
// makes the apex rise — v²/(2·gravity) — exactly 1 cell: a single-line hop
// regardless of gravity. Keeps timeout (`y < 0`) pressure intact at the top
// of the viewport. With the current gravity (18) the apex is reached at
// v/g ≈ 0.33s and total airtime is ≈ 0.67s.
export const PLAYER_JUMP_VELOCITY_CELLS_PER_SEC = 6;

// [TUNING] Initial downward velocity stamped on the player the moment they
// walk off a platform. Without this kick, line-scroll keeps the player
// inside the `dy ∈ [0, 1]` catch range long enough that walking back onto
// the segment grabs the platform from below. Tuned just under LINE_RATE_MAX
// so 1-cell gap traversal still lands while walk-back grabs run out of
// catch range in ≈ 100 ms.
export const PLAYER_TAKEOFF_DROP_CELLS_PER_SEC = 8;

// [TUNING] Late-jump grace window: jump input is still honored if pressed
// within this many ms after the player walked off a platform. Standard
// platformer QoL; named after Wile E. Coyote's mid-air stall.
export const COYOTE_TIME_MS = 100;

// [TUNING] Dash burst length and cooldown. The duration is long enough that
// the burst is unmistakable on screen; the cooldown keeps spam from making
// the rest of the kit irrelevant.
export const DASH_DURATION_MS = 220;
export const DASH_COOLDOWN_MS = 500;

// [TUNING] Horizontal speed during a dash — 4× normal walking speed.
// At 220ms duration that yields ≈ 10.5 cells of dash distance, big enough
// that the player feels the snap even on smaller viewports.
export const DASH_HORIZONTAL_CELLS_PER_SEC = 48;

export const SOLVABILITY = {
  shortLineRatio: 0.3, // [TUNING]
  shortLineRunCap: 3, // [TUNING]
  adjacencyMaxGapCells: 5, // [TUNING] spec §1.3b uses 5 as example
} as const;

// [TUNING] Score (= deepest stepped line) at which horizontal projectiles
// start spawning. Below this the run is the original "just dodge gravity"
// challenge; above it a second axis of pressure kicks in, capping the runs
// that would otherwise drift past four-digit scores indefinitely.
export const PROJECTILE_SPAWN_THRESHOLD_SCORE = 10;

// [TUNING] Telegraph lead time — a blinking dot appears at the row's right
// edge this many ms before the projectile actually enters the row.
export const PROJECTILE_TELEGRAPH_MS = 500;

// [TUNING] Random horizontal speed range. Min must beat the player's walk
// (12 cells/sec) so a "run from the missile" strategy cannot win every time;
// max kept under DASH_HORIZONTAL_CELLS_PER_SEC (48) so a perfectly-timed dash
// can still outrun the worst roll.
export const PROJECTILE_VELOCITY_MIN_CELLS_PER_SEC = 14;
export const PROJECTILE_VELOCITY_MAX_CELLS_PER_SEC = 38;

// [TUNING] Random interval between telegraph spawns. Only ticks down once
// score ≥ PROJECTILE_SPAWN_THRESHOLD_SCORE. Tight intervals keep pressure on
// even when a player camps on a comfortable platform.
export const PROJECTILE_SPAWN_INTERVAL_MIN_MS = 1_100;
export const PROJECTILE_SPAWN_INTERVAL_MAX_MS = 3_000;

// [TUNING] Weight multiplier applied to candidate rows whose stand-line sits
// ABOVE the player. The run only ever moves downward, so missiles spawned
// above the player are cosmetic — visible flair, no real threat. Keep them
// rare but not zero so the field doesn't feel half-empty. 0.2 = upward rows
// pick at ~20% the rate of downward rows at the same distance.
export const PROJECTILE_UPWARD_WEIGHT_FACTOR = 0.2;

// Single-cell glyphs. Picked to stay inside the terminal/box-drawing aesthetic.
export const PROJECTILE_GLYPH = '◄';
export const TELEGRAPH_GLYPH = '•';

// Three-stage explosion. The impact frame lights up a radial cluster
// (center + horizontal arms at ±1ch/±2ch + sub-row vertical pips + diagonal
// sparks) so the burst reads as a near-circular pop. Cells outside the
// center never use neighboring rows (`dy: ±1` = 16px gap) — instead the
// top/bottom pips and diagonals are nudged within the center cell by a
// sub-row pixel offset, which makes the silhouette read as a tight star
// rather than a 32px-tall vertical oval. Heat ramps inward: muted residue
// at the outer edges, destructive (red/orange) on the inner ring, and
// foreground (bright) at the core — so it reads as a heat gradient instead
// of a flat blood spatter.
export const EXPLOSION_GLYPHS = {
  core: '●', // filled disc at center — heaviest, hottest cell
  flash: '✶', // 6-point spark on the flash frame, center only
  residue: '·', // soot dot for the residue fade
  armNear: '*', // inner cardinal arms (±1ch horizontally, vertical pip)
  armFar: '·', // outer cardinal arms (±2ch horizontally) — wisp at the tip
  diag: '·', // diagonal sparks, sub-row offset so they don't extend into neighboring rows
} as const;

// [TUNING] Sub-row vertical offsets (in pixels) for the top/bottom pip and
// diagonals. Cell rows are 16px tall; ±5/6px keeps the burst inside the
// impact row visually, avoiding the vertical-oval artifact that ±1 cell
// spacing produced (16px gap vs 7-8px horizontal gap → 2:1 elongation).
export const EXPLOSION_VERTICAL_PIP_PX = 5; // top/bottom arms
export const EXPLOSION_DIAGONAL_PX = 4; // diagonal sparks

// [TUNING] Explosion timing. Short enough that consecutive missiles don't
// stack visually, long enough that the impact frame can carry the "pop" at
// 60fps. Past iterations were either too snappy (160ms) or too gory (700ms
// with a 3-cell color-inverted slab).
export const EXPLOSION_DURATION_MS = 380;
export const EXPLOSION_IMPACT_MS = 90;
export const EXPLOSION_FLASH_MS = 150;

export const VERSION = '1.0.0';
