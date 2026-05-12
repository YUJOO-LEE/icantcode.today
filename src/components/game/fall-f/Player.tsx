import { FIELD_GUTTER_LEFT_PX, ROW_HEIGHT_PX } from './constants';
import type { DashDirection, InputState } from './types';

interface PlayerProps {
  x: number;
  y: number;
  input: InputState;
  velocityY: number;
  dashDirection: DashDirection | null;
}

/**
 * Map the player's current motion state to a single box-drawing glyph.
 * Priority (top wins):
 *   1. active dash — left/right half blocks (▌/▐).
 *   2. upward jump (negative velocityY) — upper-half block.
 *   3. horizontal walk input — left/right half blocks.
 *   4. idle — full block.
 *
 * Death is rendered by `ResultScreen`, not by this component, so there are no
 * `*` / `x` death glyphs here.
 */
function pickGlyph(
  input: InputState,
  velocityY: number,
  dash: DashDirection | null,
): string {
  if (dash === 'left') return '▌';
  if (dash === 'right') return '▐';
  if (velocityY < 0) return '▀';
  if (input === 'left') return '▌';
  if (input === 'right') return '▐';
  return '█';
}

function Player({ x, y, input, velocityY, dashDirection }: PlayerProps) {
  const glyph = pickGlyph(input, velocityY, dashDirection);
  return (
    <span
      className="absolute text-primary leading-none pointer-events-none select-none"
      style={{
        top: `${y * ROW_HEIGHT_PX}px`,
        left: `calc(${FIELD_GUTTER_LEFT_PX}px + ${x}ch)`,
        height: `${ROW_HEIGHT_PX}px`,
        lineHeight: `${ROW_HEIGHT_PX}px`,
      }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

export default Player;
