import { FIELD_GUTTER_LEFT_PX, PUSHER_GLYPH, PUSHER_LENGTH, ROW_HEIGHT_PX } from './constants';

interface PusherProps {
  /** Leading-edge column (rightmost glyph). */
  x: number;
  y: number;
}

/**
 * Left-to-right gust hazard. Renders as `PUSHER_LENGTH` `)` glyphs sliding
 * along a gap row. Each glyph is pinned to a 1ch cell — same alignment guard
 * Player/Projectile/Telegraph use — so the visual position matches the
 * `Math.round`-based collision cells in `tickGameState`.
 *
 * Body cells: `[x - PUSHER_LENGTH + 1, x]`. While the trailing cells are
 * still off-screen (x < PUSHER_LENGTH - 1) the leading `)` enters alone and
 * the rest emerge over time — that staggered entry is what telegraphs the
 * hazard to the player (no separate blinking warning needed).
 */
function Pusher({ x, y }: PusherProps) {
  const cells: number[] = [];
  for (let i = 0; i < PUSHER_LENGTH; i += 1) {
    cells.push(i);
  }
  return (
    <>
      {cells.map((i) => (
        <span
          key={i}
          data-testid="ff-pusher"
          className="absolute text-secondary-foreground leading-none pointer-events-none select-none"
          style={{
            top: `${y * ROW_HEIGHT_PX}px`,
            left: `calc(${FIELD_GUTTER_LEFT_PX}px + ${x - i}ch)`,
            height: `${ROW_HEIGHT_PX}px`,
            lineHeight: `${ROW_HEIGHT_PX}px`,
            display: 'inline-block',
            width: '1ch',
            textAlign: 'center',
            // Trailing body fades out so the leading edge reads as the
            // active push point and the rest as the wake.
            opacity: 1 - i * 0.2,
          }}
          aria-hidden="true"
        >
          {PUSHER_GLYPH}
        </span>
      ))}
    </>
  );
}

export default Pusher;
