import { FIELD_GUTTER_LEFT_PX, ROW_HEIGHT_PX, TELEGRAPH_GLYPH } from './constants';

interface TelegraphProps {
  /** Cell column at the right edge of the field (cols - 1). */
  x: number;
  y: number;
}

/**
 * Blinking warning dot drawn at the right edge of a row, half a second before
 * a projectile sweeps across it. `motion-safe` gates the pulse so users with
 * `prefers-reduced-motion: reduce` still see a steady dot — the warning is
 * functional, not decorative.
 */
function Telegraph({ x, y }: TelegraphProps) {
  return (
    <span
      data-testid="ff-telegraph"
      className="absolute text-destructive leading-none pointer-events-none select-none motion-safe:animate-pulse"
      style={{
        top: `${y * ROW_HEIGHT_PX}px`,
        left: `calc(${FIELD_GUTTER_LEFT_PX}px + ${x}ch)`,
        height: `${ROW_HEIGHT_PX}px`,
        lineHeight: `${ROW_HEIGHT_PX}px`,
        // 1ch-cell guard — `•` falls back outside MulmaruMono.
        display: 'inline-block',
        width: '1ch',
        textAlign: 'center',
      }}
      aria-hidden="true"
    >
      {TELEGRAPH_GLYPH}
    </span>
  );
}

export default Telegraph;
