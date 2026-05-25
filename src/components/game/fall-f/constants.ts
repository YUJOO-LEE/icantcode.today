// Tags: [SPEC] = directly from FALL_F.md §A.
//       [TUNING] = author-suggested starting value, adjust freely.

// [SPEC §A.3] Progressive line-rate curve — discrete 21-step ease-in.
// Each step advances every LEVEL_DURATION_MS. The opening bumps are now
// large (+0.25 then +0.30 per step) so the first minute already feels
// like pressure rather than the old 1.0–1.5 idle drift; the cap stays
// at 8.9 line/sec (= 200s mark) so late-game ceiling is unchanged.
//
// Game-balance invariant: LINE_RATE_MAX MUST stay strictly below
// PLAYER_GRAVITY_CELLS_PER_SEC. If lines scroll up faster than the player
// falls, a player standing on a platform can no longer reach a lower
// platform and the game becomes unwinnable past the cap. Enforced by a
// unit test in `__tests__/gameState.test.ts`.
//
// Jump survivability check: a single jump costs ~0.667s of airtime, so
// at the cap (8.9 line/sec) the player scrolls ~5.94 cells closer to
// the top edge during the arc. Platforms below mid-screen still leave
// safe headroom — no timeout-death from a routine hop.
export const LEVEL_DURATION_MS = 10_000;
export const LEVEL_RATES = [
  1.0, // L0  — 0–10s
  1.25, // L1  — 10–20s  (+0.25 — opening is no longer flat)
  1.55, // L2  — 20–30s  (+0.30)
  1.85, // L3  — 30–40s  (+0.30)
  2.15, // L4  — 40–50s  (+0.30)
  2.45, // L5  — 50–60s  (+0.30)
  2.75, // L6  — 60–70s  (+0.30) — at the old L9 (90s) tempo by 60s
  3.05, // L7  — 70–80s  (+0.30)
  3.4, // L8  — 80–90s  (+0.35)
  3.75, // L9  — 90–100s (+0.35)
  4.1, // L10 — 100–110s (+0.35)
  4.5, // L11 — 110–120s (+0.40)
  4.95, // L12 — 120–130s (+0.45)
  5.45, // L13 — 130–140s (+0.50)
  6.0, // L14 — 140–150s (+0.55)
  6.55, // L15 — 150–160s (+0.55)
  7.1, // L16 — 160–170s (+0.55)
  7.65, // L17 — 170–180s (+0.55)
  8.15, // L18 — 180–190s (+0.50)
  8.55, // L19 — 190–200s (+0.40)
  8.9, // L20+ — 200s and beyond (cap — unchanged)
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
// Keep this small relative to LINE_RATE_MAX: at 500ms the targeted row
// scrolled ~4.5 cells upward before the missile actually flew, so by the
// time anything launched the row had drifted into the upper third of the
// screen and a player camping near the bottom was never threatened. 300ms
// keeps the warning visible while only scrolling ~2.7 cells at the cap.
export const PROJECTILE_TELEGRAPH_MS = 300;

// [TUNING] Random horizontal speed range. Min must beat the player's walk
// (12 cells/sec) so a "run from the missile" strategy cannot win every time;
// max kept under DASH_HORIZONTAL_CELLS_PER_SEC (48) so a perfectly-timed dash
// can still outrun the worst roll.
export const PROJECTILE_VELOCITY_MIN_CELLS_PER_SEC = 14;
export const PROJECTILE_VELOCITY_MAX_CELLS_PER_SEC = 38;

// [TUNING] Random interval between telegraph spawns. Only ticks down once
// score ≥ PROJECTILE_SPAWN_THRESHOLD_SCORE. Tight intervals keep pressure on
// even when a player camps on a comfortable platform. The interval is then
// scaled by a score-driven factor (see *_RAMP_SCORE / *_MIN_FACTOR) so the
// cadence ramps up as the run goes deeper.
export const PROJECTILE_SPAWN_INTERVAL_MIN_MS = 1_100;
export const PROJECTILE_SPAWN_INTERVAL_MAX_MS = 3_000;

// [TUNING] Score over `THRESHOLD` at which the spawn interval has been
// shrunk all the way down to MIN_FACTOR (no further). Earlier ramp = the
// curve actually bites within a single run — at the old 700 threshold
// most matches ended before the player noticed the ramp at all. 350
// puts the cap at roughly the halfway mark of a typical run; 0.22 makes
// the cap interval ~4.5× the base spawn rate at threshold instead of 3×,
// so the late game has the "missile spam" feel the curve is meant to
// produce.
export const PROJECTILE_SPAWN_INTERVAL_RAMP_SCORE = 350;
export const PROJECTILE_SPAWN_INTERVAL_MIN_FACTOR = 0.22;

// [TUNING] Weight multiplier applied to candidate rows whose stand-line sits
// ABOVE the player. The run only ever moves downward, so missiles spawned
// above the player are cosmetic — visible flair, no real threat. Keep them
// rare but not zero so the field doesn't feel half-empty. 0.1 = upward rows
// pick at ~10% the rate of downward rows at the same distance — at 0.2 the
// field still felt biased toward already-passed rows once the telegraph
// scroll was factored in.
export const PROJECTILE_UPWARD_WEIGHT_FACTOR = 0.1;

// Single-cell glyphs. Picked to stay inside the terminal/box-drawing aesthetic.
export const PROJECTILE_GLYPH = '◄';
export const TELEGRAPH_GLYPH = '•';

// ─── PUSHER hazard ─────────────────────────────────────────────────────────
// Left-to-right "gust" that only travels along fully empty (gap) rows. The
// missile axis is right-to-left and deadly on contact; pushers are the
// opposite axis — slower, non-lethal on its own, but they drag a grounded
// player to the right until the player either jumps clear or runs out of
// platform under their feet. They never overlap a platform line, so they
// won't crash through a real row.

// [TUNING] Pusher visual: an opening parenthesis "spit" sequence. The body
// is `LENGTH` cells wide and spawned as a staggered streak — three `)`
// glyphs entering the viewport one at a time so the rising count of dots
// itself reads as the "telegraph" (no separate blinking warning needed).
export const PUSHER_GLYPH = ')';
export const PUSHER_LENGTH = 3;

// [TUNING] Score at which pushers begin spawning. 0 = no gate; the gust can
// appear from the very first gap row of the run. Spawn cadence is slow
// enough (~2.5–5.5s base) that opening minutes still feel mostly about
// gravity, but an unlucky early gust is intentional flavor.
export const PUSHER_SPAWN_THRESHOLD_SCORE = 0;

// [TUNING] Horizontal speed range. Min must clearly beat a standing player
// (no horizontal velocity unless walking — 12 cells/sec) so just standing
// still can't outpace the gust; max kept well under missile's 38 so the two
// hazards stay visually and tactically distinct.
export const PUSHER_VELOCITY_MIN_CELLS_PER_SEC = 6;
export const PUSHER_VELOCITY_MAX_CELLS_PER_SEC = 14;

// [TUNING] Spawn cadence (ms). Slower than missiles so the screen never
// fills with both hazards at once. Like the missile cadence this scales
// down with score, but with a gentler ramp.
export const PUSHER_SPAWN_INTERVAL_MIN_MS = 2_500;
export const PUSHER_SPAWN_INTERVAL_MAX_MS = 5_500;
export const PUSHER_SPAWN_INTERVAL_RAMP_SCORE = 600;
export const PUSHER_SPAWN_INTERVAL_MIN_FACTOR = 0.4;

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
