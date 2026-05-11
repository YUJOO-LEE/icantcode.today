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

// [TUNING] Extra downward velocity during a `down` dash. Adds on top of
// regular gravity-driven fall for a sharp plunge through gaps.
export const DASH_VERTICAL_CELLS_PER_SEC = 32;

export const SOLVABILITY = {
  shortLineRatio: 0.3, // [TUNING]
  shortLineRunCap: 3, // [TUNING]
  adjacencyMaxGapCells: 5, // [TUNING] spec §1.3b uses 5 as example
} as const;

export const VERSION = '1.0.0';
