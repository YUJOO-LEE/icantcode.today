# fall -f — Implementation Plan (MVP)

> **Audience**: AI agent implementing this game.
> **Authoritative spec**: [`./FALL_F.md`](./FALL_F.md) §A (MVP).
> Ignore §B (Next Phase) and §1–§5 (rationale/alternatives) unless explicitly
> instructed. When this plan and the spec conflict, the spec wins.
> **Project rules**: [`../CLAUDE.md`](../CLAUDE.md). Never violate.
>
> ### Anti-hallucination notes
>
> - Numbers and identifiers in this plan come from one of three sources,
>   **always disclosed inline**:
>   1. **`[SPEC §X]`** — direct from `FALL_F.md` §A. Authoritative.
>   2. **`[TUNING]`** — author-suggested starting values for playtest.
>      **Not in spec.** Adjust freely during implementation.
>   3. **`[VERIFIED <path>]`** — confirmed by reading existing code.
> - When the source is none of the above, the plan must say so explicitly
>   ("not specified — pick a value and document it in `constants.ts`").
> - Never invent file paths, hook names, library APIs, or version numbers.
>   If unknown: leave a TODO and ask the user.

## 0. Hard rules

1. Strict TypeScript. `tsc -b` must pass. No `any`.
2. No new runtime dependency without explicit user approval. The router
   choice (§3.1) is the one decision that needs user approval before coding.
3. Test-first. RED → GREEN → REFACTOR (CLAUDE.md TDD section).
4. Tailwind v4 + CSS variables. No hardcoded hex colors in components.
5. UI text policy: see spec §A.12. System tokens English-only; player-facing
   labels via i18n.
6. Commit only when user explicitly asks. Push only when user explicitly asks.
   No `Co-Authored-By` lines.
7. The game must never produce a horizontal scrollbar (spec §A.8).

## 1. Goal

Ship `/game/fall-f` as MVP behind a new `/game` catalog route. Game must:

- Render entirely client-side. No server changes, no API calls.
- Be reachable from header `[ play ]` and from `/game` catalog.
- Be independent from API status. `[VERIFIED]` the existing API hooks are `useStatusQuery` (`src/apis/queries/useStatus.ts`) and the `useStatusStore` selector — neither should be imported inside `src/components/game/`.
- Pass `npm run typecheck`, `npm run lint`, `npm run test:run`,
  `npm run e2e`, `npm run build`.

## 2. Files to create

```
src/components/game/
  CatalogPage.tsx              # /game route
  GamePage.tsx                 # /game/:slug route, dispatches to game by slug
  fall-f/
    FallFGame.tsx              # Top-level game container (state machine)
    InitialScreen.tsx          # Idle → Enter → start
    ResultScreen.tsx           # SEGFAULT / TIMEOUT result
    GameField.tsx              # Renders rows of LineGroup + Player
    LineGroup.tsx              # One group of lines (1+ rows)
    Player.tsx                 # █ / ▌ / ▐ glyph rendering
    constants.ts               # Game-tuning constants (single source)
    types.ts                   # All game-internal TS types
    linePool.ts                # Static line pool (groups[])
    solvability.ts             # R-1 + R-2 enforcement
    grid.ts                    # Px ↔ cell conversions, viewport sizing
    physics.ts                 # Pure functions: gravity, slide, collision
    useGameLoop.ts             # rAF game tick
    useKeyboard.ts             # ← / → keydown/keyup + Enter
    useTouchControls.ts        # Mobile left/right tap zones
    useVisibility.ts           # Tab pause/resume
    __tests__/
      solvability.test.ts
      physics.test.ts
      grid.test.ts
      linePool.test.ts
      InitialScreen.test.tsx
      ResultScreen.test.tsx
      FallFGame.test.tsx

src/locales/ko/game.json       # ko strings (player-facing only)
src/locales/en/game.json       # en strings

public/fonts/
  dejavu-blocks.woff2          # DejaVu Sans Mono subset, U+2500–U+259F
  LICENSE_DejaVu.txt

e2e/visual/
  fall-f.spec.ts               # Playwright visual baselines

scripts/
  build-block-font.mjs         # Optional: documents how subset was built
```

## 3. Files to modify

### 3.1 Router introduction (BLOCKER — needs user approval)

`[VERIFIED]` App has no router currently. `grep -r 'react-router\|BrowserRouter\|HashRouter\|createBrowserRouter' src` returns no matches.

Two options to discuss with user:

| Option | Notes |
|---|---|
| Add a routing library (e.g. `react-router`) | Standard. Bundle cost not measured by this plan. New runtime dep — needs user approval (CLAUDE.md). |
| Custom hash routing | Implement `useHashRoute` hook + minimal `<Link>`. No new dep. Approx 100 LOC. |

**Action**: Before Phase 2, ask user which to adopt. Until decision: develop
pages but keep `App.tsx` switching on a local state variable so unit tests
pass without router.

Updated files (whichever option):
- `[VERIFIED src/App.tsx]` — add `/`, `/game`, `/game/fall-f`.
- `[VERIFIED src/components/layout/Header.tsx]` — add `[ play ]` nav item
  with `│` separator before existing lang/theme buttons (the buttons
  exist; verified). Title click navigates to `/`.

### 3.2 Existing files

| File | Change |
|---|---|
| `src/styles/globals.css` (or `theme.css`) | Add `@font-face { font-family: 'BlockGlyphs'; src: url('/fonts/dejavu-blocks.woff2') format('woff2'); unicode-range: U+2500-259F; font-display: swap; }`. Update body `font-family` chain to include `'BlockGlyphs'` between `'MulmaruMono'` and `'MulmaruMono Fallback'`. |
| `src/locales/ko/common.json`, `src/locales/en/common.json` | Add `siteNav.game = "play"`. |
| `src/lib/i18n.ts` (or wherever namespaces are registered) | Register new `game` namespace. |
| `index.html` | Do NOT add font preload (spec §A.11). |

## 4. Constants (mark every source)

`src/components/game/fall-f/constants.ts` — every value tagged with its
source. AI must respect tags: never silently change a `[SPEC]` value;
freely adjust `[TUNING]` ones during playtest.

```ts
// LINE RATE — from spec §A.3 (do not change without updating spec)
export const LINE_RATE = {
  phase1: { untilMs: 20_000,    linesPerSec: 1.0 }, // [SPEC §A.3]
  phase2: { untilMs: 60_000,    linesPerSec: 1.3 }, // [SPEC §A.3]
  phase3: { untilMs: Infinity,  linesPerSec: 1.6 }, // [SPEC §A.3]
};

// PRESSURE GROUP RATIO — spec range, plan picks midpoint
export const PRESSURE_GROUP_RATIO = 0.15;   // [TUNING] spec §A.9 says 10–20%

// GAP — directly from spec
export const GAP_RANGE = [1, 2] as const;   // [SPEC §A.5 / §1.5]

// ROW HEIGHT — spec uses "~24px" to size viewport rows
export const ROW_HEIGHT_PX = 24;            // [SPEC §A.8] approximate

// GRACE PERIOD — spec §A.5 says "≈0.5s"
export const FIRST_LINE_DELAY_MS = 500;     // [SPEC §A.5] approximate

// PLAYER PHYSICS — not in spec, pure playtest values
export const PLAYER_GRAVITY_CELLS_PER_SEC = 8;  // [TUNING]
export const PLAYER_MOVE_CELLS_PER_SEC = 12;    // [TUNING]

// SOLVABILITY — spec §1.3b describes the rules but does not pin numbers
export const SOLVABILITY = {
  shortLineRatio: 0.30,    // [TUNING] "short" = max width ≤ 30% cols
  shortLineRunCap: 3,      // [TUNING] R-1 trigger: 3 short groups in a row
  adjacencyMaxGapCells: 5, // [TUNING] R-2: spec §1.3b uses 5 as example
};
```

## 5. Types (canonical)

```ts
// src/components/game/fall-f/types.ts
export type Cell = number; // integer column index, 0-based

export interface PlatformSegment {
  startX: Cell;   // inclusive
  endX: Cell;     // inclusive
}

export interface StaticLine {
  text: string;             // raw line text including leading indent
}

export interface DynamicLine {
  kind: 'shrink-right' | 'fill-right'; // spec §A.9
  initial: string;                     // initial rendered text
  shrinkPerSec?: number;               // for shrink-right
  durationSec?: number;                // for fill-right
  filled?: string; empty?: string;     // for fill-right
}

export type Line = StaticLine | DynamicLine;

export interface LineGroup {
  lines: Line[];
  gap: 1 | 2;             // empty rows after this group
}

export type InputState = 'none' | 'left' | 'right' | 'both';

export interface Player {
  x: Cell;
  y: Cell;            // current screen row
  falling: boolean;
  input: InputState;
}

export interface Viewport {
  rows: number;
  cols: number;
}

export type GameStatus =
  | 'idle'                // InitialScreen visible
  | 'playing'
  | 'paused'              // tab hidden
  | 'dead-segfault'
  | 'dead-timeout';

export interface RenderedLine {
  text: string;           // current visible text (after dynamic shrink applied)
  segments: PlatformSegment[]; // platform segments for this single line
}

export interface GroupRow {
  groupId: string;
  lines: RenderedLine[];
  segments: PlatformSegment[]; // union of all line segments in this group
  topRow: number;         // current screen row index (changes as group scrolls up)
}

export interface GameState {
  status: GameStatus;
  startedAtMs: number;    // wall-clock when current run started
  elapsedMs: number;      // accumulated playing time, frozen during 'paused'
  score: number;          // groups that have scrolled out the top
  best: number;           // session-memory record
  player: Player;
  rows: GroupRow[];       // top-to-bottom rendering order
  viewport: Viewport;     // current cols/rows from grid.ts
}
```

## 6. Phases (do in order)

Each phase: write tests first (RED), implement (GREEN), refactor.
Each phase ends with a typecheck + the affected test files passing.

### Phase 1 — Foundation

Goal: env + assets + token plumbing only. No game logic yet.

Steps:
1. Build DejaVu Sans Mono subset (run once, commit binary):
   ```sh
   pip install fonttools brotli  # or use a temp venv
   pyftsubset DejaVuSansMono.ttf \
     --unicodes=U+2500-259F --flavor=woff2 \
     --output-file=public/fonts/dejavu-blocks.woff2
   ```
   Commit `dejavu-blocks.woff2` and `LICENSE_DejaVu.txt`. Document the
   exact command in `scripts/build-block-font.mjs` as a comment.
2. Update `globals.css` font chain (§3.2).
3. Create `src/locales/{ko,en}/game.json` (empty `{}` for now).
4. Register `game` namespace in i18n.

Acceptance:
- `npm run dev` loads. Existing UI is unchanged. Network shows
  `dejavu-blocks.woff2` requested when a box-drawing char is rendered.

### Phase 2 — Routing & header

**Blocked by user decision in §3.1.**

Steps:
1. Adopt chosen routing approach.
2. Add `/game` and `/game/fall-f` routes — empty placeholder pages.
3. Update `Header.tsx`: title becomes a link to `/`, append `[ play ]`
   nav item with `│` separator before lang/theme group.
4. Add `siteNav.game` translation keys.

Acceptance:
- Click logo → `/`. Click `[ play ]` → `/game`. URL bar reflects route.
- Header tests still pass; add a test for the new link.

### Phase 3 — Catalog page

Layout from spec §A.7 verbatim. No game logic.

```
$ ls -la /game/

-rwxr-xr-x  fall-f             2026-05  follow the fall
-rwxr-xr-x  (more coming...)

> _
```

Steps:
1. `CatalogPage.tsx` renders the table inside an existing
   `TerminalCard`-style wrapper.
2. `fall-f` is a `<Link>` to `/game/fall-f`. `(more coming...)` is plain
   text.
3. Tests: render, link target, `>` cursor blinks (or static OK).

### Phase 4 — Initial & Result screens (no game loop yet)

Layout from spec §A.5 (Initial) and §A.6 (Result).

Steps:
1. `InitialScreen.tsx`:
   - Static layout, exact whitespace from spec.
   - Translatable labels: `KEYS:`, `DEATH:`, `best:`, `pushed off the top`,
     `fell through all platforms`, `←/→ move`, `press [Enter] to start_`.
     System tokens (`[TIMEOUT]`, `[SEGFAULT]`, `$ fall -f`, header line,
     `follow the fall`) are hardcoded English.
   - `best:` row hidden when no session record.
   - Mobile: swap `press [Enter] to start_` → `tap to start`.
   - On Enter / tap → call `onStart()` prop.
2. `ResultScreen.tsx`:
   - Two variants: `dead-segfault`, `dead-timeout`. Title differs (`§A.6`).
   - Stack trace lines: `at line N, score N`, `best N`, `in fall_f::on_tick (game.ts:42)`.
   - `[ > retry ]` and `[ > home ]` actions. Default focus = retry.
3. RTL tests for both screens.

### Phase 5 — Grid & viewport

Goal: pure utilities for cell ↔ pixel and viewport sizing.

`grid.ts` API:
```ts
export function measureCellWidth(): number;   // px per char in current font
export function getViewport(): { rows: number; cols: number };
export function rowsForHeight(heightPx: number): number;
export function colsForWidth(widthPx: number): number;
```

Steps:
1. Implement using a hidden offscreen `<span>` measurement.
2. Subscribe to `window` resize. Recompute on resize. New lines use
   current cols; existing lines retain the cols they were generated with
   (spec §A.8).
3. Apply `overflow: hidden` (or `overflow: clip`) on the game field
   container. **No horizontal scrollbar may appear**, even with mismatched
   line widths after a resize-down (spec §A.8).
4. Tests: `colsForWidth`, `rowsForHeight`, single resize behavior.

### Phase 6 — Line pool + solvability

`linePool.ts` API:
```ts
export const STATIC_GROUPS: LineGroup[]; // see content rules below
export const DYNAMIC_GROUPS: LineGroup[]; // shrink-right + fill-right kinds (spec §A.9)
```

Content rules:
- All entries English (spec §A.12 line-pool policy).
- Mix kinds: single-line commands (`$ npm run build`), multi-line ls/ps
  output, vite/tsc build progress, error messages with indent.
- The pool size is not specified by spec. Provide enough variety that
  R-1 / R-2 solvability has room to operate without repeating the same
  group too often. `[TUNING]` — start with a modest pool, grow as needed.
  Document the chosen count in a top-of-file comment in `linePool.ts`.
- Per-line length: spec does not pin numbers. Aim for variety across the
  full viewport-cols range so length-3 short and near-full-width lines
  both appear. `[TUNING]`.

`solvability.ts` API:
```ts
export interface NextLineRequest {
  recentSegments: PlatformSegment[][]; // last SOLVABILITY.shortLineRunCap group segment-lists
  currentCols: number;
}
export function pickNextGroup(req: NextLineRequest): LineGroup;
```

Rules (refer to `constants.ts SOLVABILITY` for the actual tunable values;
the rule shapes come from spec §1.3b):

- **R-1 — short-line run cap.** When the last `shortLineRunCap` groups all
  have max line width ≤ `shortLineRatio × currentCols`, the next group
  MUST contain at least one line with width strictly greater than
  `shortLineRatio × currentCols`. Spec §1.3b states the rule shape; the
  numbers are `[TUNING]`.
- **R-2 — adjacency.** The union of the new group's platform segments must
  be within `adjacencyMaxGapCells` of the union of the immediately
  previous group's platform segments (overlap counts as 0 gap). Spec §1.3b
  uses 5 as an *example*; we adopt 5 as the starting `[TUNING]` value.
- **Pressure ratio.** `PRESSURE_GROUP_RATIO` (default 0.15, spec §A.9
  range 0.10–0.20) of picks come from `DYNAMIC_GROUPS`.

Tests:
- Property-style: 1000 random picks with seeded RNG (§7), assert that
  every pair of consecutive groups satisfies R-2.
- R-1 trigger case: feed `shortLineRunCap` short groups; assert next pick
  is non-short.
- R-2 boundary case: groups exactly `adjacencyMaxGapCells` apart should
  pass; one cell beyond should be rejected.

### Phase 7 — Physics & line scrolling

`physics.ts` (pure functions):
```ts
export function applyGravity(player: Player, dt: number, rows: GroupRow[]): Player;
export function applyHorizontal(player: Player, input: 'left'|'right'|'none'|'both', dt: number, rows: GroupRow[]): Player;
export function autoSlide(player: Player, segment: PlatformSegment): Player;
export function detectDeath(player: Player, viewport: Viewport): 'segfault' | 'timeout' | null;
```

Tests:
- Player on segment → moves up with group when group scrolls up.
- Player past segment endX → starts falling.
- Player above viewport top → death = 'timeout'.
- Player below viewport bottom with no segment match → 'segfault'.
- Auto-slide: shrinking segment pushes player back into bounds.

### Phase 8 — Game loop

`useGameLoop.ts`:
- Single `requestAnimationFrame` loop.
- Tick: input → physics → spawn next group when bottom row needs one
  (rate per spec §A.3 difficulty curve) → death check → score update.
- Score = number of groups that have scrolled out the top.
- `best` is **session-memory only** — `[SPEC §A.13]`. Hold it in a module
  variable or React state. **Do not** write to `localStorage`,
  `sessionStorage`, IndexedDB, or any persistent store. Page refresh
  resets `best` to 0 (matches site's no-login session policy).

Spawning timing:
- T=0 of game: rows empty, player at top spawn position, falling.
- After `FIRST_LINE_DELAY_MS` (500ms), first group enters bottom row.
- Subsequent groups enter at intervals from line rate.

`useKeyboard.ts`:
- Tracks `ArrowLeft`, `ArrowRight` keydown/keyup for movement.
- Tracks `Enter` for `idle → playing` and `dead-* → playing` (retry) transitions.
- Two arrows simultaneously → input becomes 'both' → glyph stays `█`.
- **`Escape` is ignored** `[SPEC §A.8]`. There is no in-game pause modal.
  Auto-pause happens only via tab visibility (`useVisibility`).
- No other keys (Space, WASD, etc.) bound. Spec defines ←/→ as the only
  movement input.

`useTouchControls.ts`:
- Two zones: `<div>` left half + right half, `position: absolute`.
- `touchstart` → input = 'left' | 'right'. `touchend` → 'none'.
- Touching both halves at once → input = 'both'.

`useVisibility.ts`:
- `document.addEventListener('visibilitychange')`.
- Hidden → cancel rAF, freeze `elapsedMs`.
- Visible → resume from same state.

### Phase 9 — Player rendering

`Player.tsx`:
- Render single character at `(player.x, player.y)`.
- Glyph mapping (spec §A.4):
  ```ts
  none → '█' // █
  left → '▌' // ▌
  right → '▐' // ▐
  both → '█' // █
  ```
- Death frame: render `*` (segfault) or `x` (timeout) for 1 frame, then
  unmount.
- Color: `text-primary` (CSS variable, spec §A.10).

### Phase 10 — Dynamic platforms

Two kinds in MVP (spec §A.9):

`shrink-right`:
- Initial text fixed.
- Every `1000 / shrinkPerSec` ms, drop the last char.
- Auto-slide player if player.x > new endX.

`fill-right`:
- Two-character template, initial all `empty`.
- Every `durationSec * 1000 / templateLen` ms, the next slot from right
  changes from `filled` to `empty` (i.e. shrinks from right). Same
  segment shrinkage as `shrink-right` but with template glyphs.

When dynamic line shrinks to 0 width and `gap` follows: group dies as if
it scrolled up out of the row above.

### Phase 11 — i18n

Strings (player-facing only — see spec §A.12 table):

```json
// src/locales/en/game.json
{
  "catalog.subtitle": "follow the fall",          // English fixed; key still exists for layout
  "labels.keys": "KEYS:",
  "labels.death": "DEATH:",
  "labels.best": "best:",
  "labels.move": "←/→ move",
  "death.timeout": "pushed off the top",
  "death.segfault": "fell through all platforms",
  "actions.retry": "[ > retry ]",
  "actions.home": "[ > home ]",
  "start.desktop": "press [Enter] to start_",
  "start.mobile": "tap to start"
}
```

```json
// src/locales/ko/game.json
{
  "catalog.subtitle": "follow the fall",
  "labels.keys": "키:",
  "labels.death": "사망:",
  "labels.best": "최고:",
  "labels.move": "←/→ 이동",
  "death.timeout": "위로 밀려 사라짐",
  "death.segfault": "발판 모두 놓치고 추락",
  "actions.retry": "[ > 다시 ]",
  "actions.home": "[ > 홈 ]",
  "start.desktop": "[Enter] 키를 눌러 시작_",
  "start.mobile": "탭하여 시작"
}
```

Hardcoded English (do NOT add to JSON):
- `[TIMEOUT]`, `[SEGFAULT]`, `core dumped`, `(core dumped)`,
  `fall_f::on_tick (game.ts:42)`, `at line N, score N`, `in fall_f::...`,
  `$ fall -f`, `── fall -f v1.0.0 — follow the fall ──`, `$ ls -la /game/`,
  `> _`, `-rwxr-xr-x`, every line in line pool.

### Phase 12 — Tests

Unit:
- `solvability.test.ts` — R-1 / R-2 properties + 1000 random picks.
- `physics.test.ts` — gravity, horizontal, auto-slide, death conditions.
- `grid.test.ts` — cell ↔ px, resize behavior.
- `linePool.test.ts` — every line ASCII-only, all groups have valid `gap`.

Component:
- `InitialScreen.test.tsx` — renders all text, Enter triggers `onStart`,
  `best:` hides when no record.
- `ResultScreen.test.tsx` — segfault vs timeout titles, retry default focus.
- `FallFGame.test.tsx` — idle → playing → dead transitions.

E2E (`e2e/visual/fall-f.spec.ts`):
- Two viewports:
  - `375x667` mobile — matches CLAUDE.md TDD section's mobile-only
    visual-regression guidance. `[VERIFIED CLAUDE.md TDD workflow]`.
  - A desktop viewport — pick whatever the existing `e2e/visual/*.spec.ts`
    suite uses to stay consistent. `[VERIFIED]` open one of the existing
    visual specs and copy its viewport. If the existing suite has no
    desktop baseline, use Playwright's default. Do not hardcode a custom
    width/height that diverges from the rest of the suite.
- Snapshot: catalog page, initial screen, mid-game (deterministic via
  seeded RNG — see §7), result screen.
- Use `npx playwright test e2e/visual --update-snapshots` to capture
  baselines; commit the PNGs alongside the code change (CLAUDE.md TDD
  section).

A11y:
- vitest-axe on InitialScreen and ResultScreen.

## 7. Determinism for tests

Inject a seeded RNG into game module:

```ts
// fall-f/rng.ts
export type RNG = () => number;
export const defaultRNG: RNG = Math.random;
export function mulberry32(seed: number): RNG { /* … */ }
```

`pickNextGroup` and dynamic line randomness take an RNG argument.
Production: `defaultRNG`. Tests / e2e: `mulberry32(seed)`.

## 8. Acceptance — Done definition (MVP)

- [ ] Phase 1–12 each ends with passing tests.
- [ ] `/game` shows catalog row for `fall-f`.
- [ ] `/game/fall-f` shows Initial → game on Enter/tap.
- [ ] Game loop produces visibly smooth motion under typical desktop and mobile devices. Spec does not pin a fps target; if frame drops are observed during playtest, profile and adjust `[TUNING]` constants in `constants.ts`.
- [ ] Tab hidden pauses, returning resumes from same state.
- [ ] Resizing window down does NOT produce a horizontal scrollbar at any
      moment; existing lines may be clipped (spec §A.8).
- [ ] Dying shows core-dumped stack-trace screen with two action buttons.
- [ ] `[ > retry ]` restarts from t=0 (new line generation, score 0).
- [ ] Header `[ play ]` link reaches `/game`. Title click reaches `/`.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test:run` passes. Per CLAUDE.md TDD section: every component, store, hook, and integration in the game module has at least one test (no specific % threshold mandated by spec).
- [ ] `npm run e2e` passes including new `fall-f.spec.ts`.
- [ ] `npm run build` produces a working production bundle.
- [ ] No new runtime dependency was added without prior user approval.

## 9. Out of scope (do not implement)

These belong to spec §B (Next Phase). Do not include in this MVP, even
if seemingly easy:

- Best-score localStorage persistence.
- "Brag in feed" / score sharing.
- API status awareness inside game. `[VERIFIED src/apis/queries/useStatus.ts, src/stores/statusStore.ts]` exist; do **not** import them inside `src/components/game/`.
- Hop / Manual Jump variants.
- Typing-in line entry, feed-line borrowing, token bonuses.
- Countdown screen, big-text overlays.
- Server leaderboard.
- Theme variants beyond light/dark.
- Font preload `<link>`.

## 10. When in doubt

1. Re-read [`./FALL_F.md`](./FALL_F.md) §A first.
2. If still unclear: prefer the simpler implementation, add a TODO with
   a precise question, and ask the user before guessing.
3. Never invent design tokens, file paths, or APIs that aren't in the
   spec or this plan.
