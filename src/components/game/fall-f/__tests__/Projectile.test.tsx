import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Projectile from '../Projectile';
import { PROJECTILE_GLYPH } from '../constants';

describe('Projectile', () => {
  it('renders the supplied glyph at the destructive color', () => {
    const { container } = render(<Projectile x={5} y={3} glyph={PROJECTILE_GLYPH} />);
    const span = screen.getByTestId('ff-projectile');
    expect(span.textContent).toBe(PROJECTILE_GLYPH);
    expect(span.className).toContain('text-destructive');
    expect(container).toBeTruthy();
  });

  it('positions itself via top/left calculated from x and y', () => {
    render(<Projectile x={7} y={2} glyph="◄" />);
    const span = screen.getByTestId('ff-projectile');
    expect(span.style.top).toBe('32px'); // y=2 * ROW_HEIGHT_PX(16)
    expect(span.style.left).toContain('7ch');
  });

  // The projectile glyph (◄) isn't in MulmaruMono and the fallback advance
  // is 1.2ch — same visual-drift trap as Player. Lock the 1ch-cell guard.
  it('pins the glyph to a single character cell', () => {
    render(<Projectile x={5} y={3} glyph="◄" />);
    const span = screen.getByTestId('ff-projectile');
    expect(span.style.width).toBe('1ch');
    expect(span.style.textAlign).toBe('center');
    expect(span.style.display).toBe('inline-block');
  });
});
