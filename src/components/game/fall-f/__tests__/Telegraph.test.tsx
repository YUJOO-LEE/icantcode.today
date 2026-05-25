import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Telegraph from '../Telegraph';
import { TELEGRAPH_GLYPH } from '../constants';

describe('Telegraph', () => {
  it('renders the telegraph glyph at the destructive color', () => {
    render(<Telegraph x={79} y={4} />);
    const span = screen.getByTestId('ff-telegraph');
    expect(span.textContent).toBe(TELEGRAPH_GLYPH);
    expect(span.className).toContain('text-destructive');
  });

  it('uses motion-safe:animate-pulse so reduced-motion users see a steady dot', () => {
    render(<Telegraph x={79} y={4} />);
    const span = screen.getByTestId('ff-telegraph');
    expect(span.className).toContain('motion-safe:animate-pulse');
  });

  it('positions itself at the supplied row and column', () => {
    render(<Telegraph x={79} y={6} />);
    const span = screen.getByTestId('ff-telegraph');
    expect(span.style.top).toBe('96px'); // 6 * 16
    expect(span.style.left).toContain('79ch');
  });

  // U+2022 bullet falls back outside MulmaruMono; keep the dot pinned to
  // a single character cell so it doesn't drift sideways.
  it('pins the dot to a single character cell', () => {
    render(<Telegraph x={79} y={4} />);
    const span = screen.getByTestId('ff-telegraph');
    expect(span.style.width).toBe('1ch');
    expect(span.style.textAlign).toBe('center');
    expect(span.style.display).toBe('inline-block');
  });
});
