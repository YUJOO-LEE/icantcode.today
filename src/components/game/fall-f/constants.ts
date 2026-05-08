// Tags: [SPEC] = directly from FALL_F.md §A.
//       [TUNING] = author-suggested starting value, adjust freely.

export const LINE_RATE = {
  phase1: { untilMs: 20_000, linesPerSec: 1.0 }, // [SPEC §A.3]
  phase2: { untilMs: 60_000, linesPerSec: 1.3 }, // [SPEC §A.3]
  phase3: { untilMs: Infinity, linesPerSec: 1.6 }, // [SPEC §A.3]
} as const;

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
