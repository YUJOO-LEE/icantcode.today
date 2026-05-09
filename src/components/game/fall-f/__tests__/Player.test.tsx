import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Player from '../Player';
import { FIELD_GUTTER_LEFT_PX, ROW_HEIGHT_PX } from '../constants';

describe('Player glyph', () => {
  it.each([
    ['none', '█'],
    ['left', '▌'],
    ['right', '▐'],
    ['both', '█'],
  ] as const)('renders the %s glyph (%s) when alive', (input, glyph) => {
    const { container } = render(<Player x={0} y={0} input={input} />);
    expect(container.textContent).toBe(glyph);
  });

  it('renders `*` when segfault, regardless of input', () => {
    const { container } = render(<Player x={0} y={0} input="left" dead="segfault" />);
    expect(container.textContent).toBe('*');
  });

  it('renders `x` when timeout, regardless of input', () => {
    const { container } = render(<Player x={0} y={0} input="right" dead="timeout" />);
    expect(container.textContent).toBe('x');
  });

  it('renders alive glyph when dead is null/undefined', () => {
    const { container, rerender } = render(<Player x={0} y={0} input="none" dead={null} />);
    expect(container.textContent).toBe('█');
    rerender(<Player x={0} y={0} input="none" />);
    expect(container.textContent).toBe('█');
  });

  it('positions the span using x (ch) and y (row * ROW_HEIGHT_PX)', () => {
    const { container } = render(<Player x={5} y={3} input="none" />);
    const span = container.querySelector('span') as HTMLSpanElement;
    expect(span).not.toBeNull();
    const style = span.getAttribute('style') ?? '';
    expect(style).toContain(`top: ${3 * ROW_HEIGHT_PX}px`);
    // jsdom may reorder calc() operands, so match each operand independently.
    expect(style).toMatch(/left:\s*calc\([^)]*5ch[^)]*\)/);
    expect(style).toMatch(new RegExp(`left:\\s*calc\\([^)]*${FIELD_GUTTER_LEFT_PX}px[^)]*\\)`));
    expect(style).toContain(`height: ${ROW_HEIGHT_PX}px`);
    expect(style).toContain(`line-height: ${ROW_HEIGHT_PX}px`);
  });

  it('is aria-hidden so screen readers ignore the glyph', () => {
    const { container } = render(<Player x={0} y={0} input="none" />);
    expect(container.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  });
});
