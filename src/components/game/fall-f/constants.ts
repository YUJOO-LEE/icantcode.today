// Tags: [SPEC] = directly from FALL_F.md §A.
//       [TUNING] = author-suggested starting value, adjust freely.

// [SPEC §A.3] Progressive line-rate curve — discrete 13-step ease-in.
// Each step advances every LEVEL_DURATION_MS. The increments themselves
// grow over time (≈ +0.12 → +0.30 line/sec) so early bumps are already
// perceptible while the cap (3.50 line/sec, ≈ 3.5× base) only arrives at
// the 120s mark — i.e. genuinely punishing late-game pace.
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
  3.5, // L12+ — 120s and beyond (cap)
] as const;
export const LEVEL_MAX = LEVEL_RATES.length - 1;
export const LINE_RATE_BASE = LEVEL_RATES[0];
export const LINE_RATE_MAX = LEVEL_RATES[LEVEL_MAX];

// [TUNING] How long the brief level-up visual feedback lingers after each
// difficulty bump. Must stay well under LEVEL_DURATION_MS so successive
// triggers never overlap.
export const LEVEL_UP_FX_DURATION_MS = 1_000;

export const PRESSURE_GROUP_RATIO = 0.15; // [TUNING] spec §A.9 says 10–20%

export const GAP_RANGE = [1, 2] as const; // [SPEC §A.5 / §1.5]

// Aligned to Tailwind v4 `text-xs` line-height (16px), the size used by most
// of the site's components. Spec §A.8 listed ~24px as an approximation.
export const ROW_HEIGHT_PX = 16;

// Left gutter of the playfield used to render the line-number column
// alongside each row, plus a small breathing gap from the wall indicator.
export const FIELD_GUTTER_LEFT_PX = 32;

// Right-side breathing room between the rightmost cell and the field edge.
export const FIELD_GUTTER_RIGHT_PX = 8;

export const FIRST_LINE_DELAY_MS = 500; // [SPEC §A.5] approximate

export const PLAYER_GRAVITY_CELLS_PER_SEC = 8; // [TUNING]
export const PLAYER_MOVE_CELLS_PER_SEC = 12; // [TUNING]

export const SOLVABILITY = {
  shortLineRatio: 0.3, // [TUNING]
  shortLineRunCap: 3, // [TUNING]
  adjacencyMaxGapCells: 5, // [TUNING] spec §1.3b uses 5 as example
} as const;

export const VERSION = '1.0.0';
