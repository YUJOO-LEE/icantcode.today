import type { CSSProperties } from 'react';
import {
  EXPLOSION_DIAGONAL_PX,
  EXPLOSION_DURATION_MS,
  EXPLOSION_FLASH_MS,
  EXPLOSION_GLYPHS,
  EXPLOSION_IMPACT_MS,
  EXPLOSION_VERTICAL_PIP_PX,
  FIELD_GUTTER_LEFT_PX,
  ROW_HEIGHT_PX,
} from './constants';

interface ExplosionProps {
  x: number;
  y: number;
  /** Counts down from EXPLOSION_DURATION_MS to 0. Drives the three-stage burst. */
  remainingMs: number;
}

type Stage = 'impact' | 'flash' | 'residue';

function stageOf(elapsedMs: number): Stage {
  if (elapsedMs < EXPLOSION_IMPACT_MS) return 'impact';
  if (elapsedMs < EXPLOSION_IMPACT_MS + EXPLOSION_FLASH_MS) return 'flash';
  return 'residue';
}

const CELL_BASE_CLASS = 'absolute leading-none pointer-events-none select-none';
const RESIDUE_DURATION_MS = EXPLOSION_DURATION_MS - EXPLOSION_IMPACT_MS - EXPLOSION_FLASH_MS;

/**
 * Heat-tier color tokens. Inner ring is hottest (foreground/primary), middle
 * ring is destructive (red/orange — the "fire" tier), outer ring fades to
 * muted-foreground (cool smoke). All come from CSS variables defined in
 * `src/styles/theme.css` — no hex literals leak into the component.
 */
type HeatTier = 'core' | 'fire' | 'smoke';
const HEAT_CLASS: Record<HeatTier, string> = {
  core: 'text-foreground',
  fire: 'text-destructive',
  smoke: 'text-muted-foreground',
};

interface BurstCell {
  /** Whole-cell horizontal offset from impact center (in ch units). */
  dx: number;
  /** Whole-cell vertical offset (in rows). Kept 0 for everything except the center
   *  — top/bottom pips use pixelDy instead so the burst stays inside one row. */
  dy: number;
  /** Sub-row vertical nudge (in pixels) applied via CSS translateY. Lets us put
   *  a "top" or "bottom" arm visually above/below the center without spending
   *  a full 16px row. Combined with horizontal ch offsets this fakes a near
   *  1:1 aspect ratio in the monospace grid. */
  pixelDy: number;
  glyph: string;
  bold: boolean;
  opacity: number;
  tier: HeatTier;
}

// Impact frame: 9-cell star
//   - 1 hot core
//   - 4 inner arms (left/right at ±1ch, top/bottom as sub-row pips at ±5px)
//   - 4 outer wisps (left/right at ±2ch, diagonals as sub-row sparks at ±4px / ±1ch)
const IMPACT_PETALS: ReadonlyArray<BurstCell> = [
  // Inner ring — "fire" tier
  { dx: -1, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.armNear, bold: true, opacity: 1, tier: 'fire' },
  { dx: 1, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.armNear, bold: true, opacity: 1, tier: 'fire' },
  { dx: 0, dy: 0, pixelDy: -EXPLOSION_VERTICAL_PIP_PX, glyph: EXPLOSION_GLYPHS.armNear, bold: true, opacity: 1, tier: 'fire' },
  { dx: 0, dy: 0, pixelDy: EXPLOSION_VERTICAL_PIP_PX, glyph: EXPLOSION_GLYPHS.armNear, bold: true, opacity: 1, tier: 'fire' },
  // Outer ring — "smoke" tier, low opacity
  { dx: -2, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.armFar, bold: false, opacity: 0.7, tier: 'smoke' },
  { dx: 2, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.armFar, bold: false, opacity: 0.7, tier: 'smoke' },
  // Diagonals — sub-row offset so they form an inner star, not an outer cross.
  // Paired with ±1ch horizontal so they sit inside the inner ring corners.
  { dx: -1, dy: 0, pixelDy: -EXPLOSION_DIAGONAL_PX, glyph: EXPLOSION_GLYPHS.diag, bold: false, opacity: 0.85, tier: 'fire' },
  { dx: 1, dy: 0, pixelDy: -EXPLOSION_DIAGONAL_PX, glyph: EXPLOSION_GLYPHS.diag, bold: false, opacity: 0.85, tier: 'fire' },
  { dx: -1, dy: 0, pixelDy: EXPLOSION_DIAGONAL_PX, glyph: EXPLOSION_GLYPHS.diag, bold: false, opacity: 0.85, tier: 'fire' },
  { dx: 1, dy: 0, pixelDy: EXPLOSION_DIAGONAL_PX, glyph: EXPLOSION_GLYPHS.diag, bold: false, opacity: 0.85, tier: 'fire' },
];

// Flash frame: smaller residual ring — only the left/right inner arms linger
// (now in smoke tier) while the center becomes a destructive-tier spark.
// Vertical pips are gone, so the silhouette collapses inward.
const FLASH_PETALS: ReadonlyArray<BurstCell> = [
  { dx: -1, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.residue, bold: false, opacity: 0.6, tier: 'smoke' },
  { dx: 1, dy: 0, pixelDy: 0, glyph: EXPLOSION_GLYPHS.residue, bold: false, opacity: 0.6, tier: 'smoke' },
];

/**
 * Three-stage explosion. Silhouette only shrinks across stages so the burst
 * reads as one continuous "pop → settle → fade" collapse:
 *   - impact (0–90ms): hot foreground core + fire-tier inner star
 *     + smoke wisps at the horizontal extremes. ±5px vertical pips fake
 *     a near-circular star inside one row.
 *   - flash (90–240ms): destructive-tier ✶ spark at center, two smoke
 *     residues at ±1ch. The silhouette has already collapsed inward.
 *   - residue (240–380ms): muted-foreground · at center, fading over the
 *     remaining time. Outer cells are gone.
 *
 * Color comes entirely from CSS variables (foreground / destructive /
 * muted-foreground). No hex literals; respects dark mode automatically.
 */
function Explosion({ x, y, remainingMs }: ExplosionProps) {
  const elapsedMs = EXPLOSION_DURATION_MS - Math.max(0, remainingMs);
  const stage = stageOf(elapsedMs);

  let centerGlyph: string;
  let centerBold = false;
  let centerOpacity = 1;
  let centerTier: HeatTier;
  if (stage === 'impact') {
    centerGlyph = EXPLOSION_GLYPHS.core;
    centerBold = true;
    centerTier = 'core';
  } else if (stage === 'flash') {
    centerGlyph = EXPLOSION_GLYPHS.flash;
    centerBold = true;
    centerTier = 'fire';
  } else {
    centerGlyph = EXPLOSION_GLYPHS.residue;
    centerTier = 'smoke';
    const into = elapsedMs - EXPLOSION_IMPACT_MS - EXPLOSION_FLASH_MS;
    centerOpacity = Math.max(0, Math.min(1, 1 - into / RESIDUE_DURATION_MS));
  }

  const petals = stage === 'impact' ? IMPACT_PETALS : stage === 'flash' ? FLASH_PETALS : [];

  const cellStyle = (
    cellX: number,
    cellY: number,
    pixelDy: number,
    opacity: number,
  ): CSSProperties => ({
    top: `${cellY * ROW_HEIGHT_PX}px`,
    left: `calc(${FIELD_GUTTER_LEFT_PX}px + ${cellX}ch)`,
    height: `${ROW_HEIGHT_PX}px`,
    lineHeight: `${ROW_HEIGHT_PX}px`,
    opacity,
    // Sub-row vertical nudge for pips / diagonals. translate3d encourages the
    // browser to composite each glyph on its own layer — cheap, and avoids a
    // sub-pixel reflow when the explosion re-renders each tick.
    transform: pixelDy === 0 ? undefined : `translate3d(0, ${pixelDy}px, 0)`,
  });

  return (
    <>
      {petals.map((cell, i) => (
        <span
          key={`${stage}-${i}`}
          data-testid="ff-explosion-petal"
          className={`${CELL_BASE_CLASS} ${HEAT_CLASS[cell.tier]}${cell.bold ? ' font-bold' : ''}`}
          style={cellStyle(x + cell.dx, y + cell.dy, cell.pixelDy, cell.opacity)}
          aria-hidden="true"
        >
          {cell.glyph}
        </span>
      ))}
      <span
        data-testid="ff-explosion"
        className={`${CELL_BASE_CLASS} ${HEAT_CLASS[centerTier]}${centerBold ? ' font-bold' : ''}`}
        style={cellStyle(x, y, 0, centerOpacity)}
        aria-hidden="true"
      >
        {centerGlyph}
      </span>
    </>
  );
}

export default Explosion;
