import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Pusher from '../Pusher';
import { PUSHER_GLYPH, PUSHER_LENGTH } from '../constants';

describe('Pusher', () => {
  it(`renders ${PUSHER_LENGTH} '${PUSHER_GLYPH}' glyphs`, () => {
    render(<Pusher x={5} y={3} />);
    const spans = screen.getAllByTestId('ff-pusher');
    expect(spans).toHaveLength(PUSHER_LENGTH);
    for (const span of spans) {
      expect(span.textContent).toBe(PUSHER_GLYPH);
    }
  });

  it('places the leading glyph at x and trails the rest to the left', () => {
    render(<Pusher x={5} y={3} />);
    const spans = screen.getAllByTestId('ff-pusher');
    expect(spans[0]?.style.left).toContain('5ch');
    expect(spans[1]?.style.left).toContain('4ch');
    expect(spans[2]?.style.left).toContain('3ch');
  });

  it('positions every glyph at top = y * ROW_HEIGHT_PX', () => {
    render(<Pusher x={5} y={4} />);
    for (const span of screen.getAllByTestId('ff-pusher')) {
      expect(span.style.top).toBe('64px');
    }
  });

  // Same 1ch-cell guard as Player/Projectile/Telegraph — falling back to the
  // system monospace renders `)` at a different advance than MulmaruMono's
  // 1ch, drifting the body off the collision cells.
  it('pins each glyph to a single character cell', () => {
    render(<Pusher x={5} y={3} />);
    for (const span of screen.getAllByTestId('ff-pusher')) {
      expect(span.style.width).toBe('1ch');
      expect(span.style.textAlign).toBe('center');
      expect(span.style.display).toBe('inline-block');
    }
  });
});
