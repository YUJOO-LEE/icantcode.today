import { FIELD_GUTTER_LEFT_PX, ROW_HEIGHT_PX } from './constants';

interface ProjectileProps {
  x: number;
  y: number;
  glyph: string;
}

/**
 * Single-cell horizontal hazard sweeping right→left. Rendered with the same
 * absolute-positioning convention as `Player` so they collide visually wherever
 * their floored cells align.
 */
function Projectile({ x, y, glyph }: ProjectileProps) {
  return (
    <span
      data-testid="ff-projectile"
      className="absolute text-destructive leading-none pointer-events-none select-none"
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

export default Projectile;
