import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Explosion from '../Explosion';
import {
  EXPLOSION_DURATION_MS,
  EXPLOSION_FLASH_MS,
  EXPLOSION_GLYPHS,
  EXPLOSION_IMPACT_MS,
} from '../constants';

const IMPACT_REMAINING = EXPLOSION_DURATION_MS - EXPLOSION_IMPACT_MS / 2;
const FLASH_REMAINING = EXPLOSION_DURATION_MS - EXPLOSION_IMPACT_MS - EXPLOSION_FLASH_MS / 2;
const RESIDUE_REMAINING = (EXPLOSION_DURATION_MS - EXPLOSION_IMPACT_MS - EXPLOSION_FLASH_MS) / 2;

describe('Explosion', () => {
  it('renders the impact glyph + the full radial petal cluster', () => {
    render(<Explosion x={5} y={4} remainingMs={IMPACT_REMAINING} />);
    expect(screen.getByTestId('ff-explosion').textContent).toBe(EXPLOSION_GLYPHS.core);
    // 4 cardinal arms + 2 horizontal wisps + 4 diagonals = 10 petals
    expect(screen.getAllByTestId('ff-explosion-petal')).toHaveLength(10);
  });

  it('switches to the flash glyph and collapses to two residual sparks', () => {
    render(<Explosion x={5} y={4} remainingMs={FLASH_REMAINING} />);
    expect(screen.getByTestId('ff-explosion').textContent).toBe(EXPLOSION_GLYPHS.flash);
    expect(screen.queryAllByTestId('ff-explosion-petal')).toHaveLength(2);
  });

  it('renders the residue dot during the final stage', () => {
    render(<Explosion x={5} y={4} remainingMs={RESIDUE_REMAINING} />);
    expect(screen.getByTestId('ff-explosion').textContent).toBe(EXPLOSION_GLYPHS.residue);
  });

  it('fades the residue dot out as remainingMs approaches 0', () => {
    render(<Explosion x={5} y={4} remainingMs={1} />);
    const span = screen.getByTestId('ff-explosion');
    const opacity = Number(span.style.opacity);
    expect(opacity).toBeLessThan(0.1);
    expect(opacity).toBeGreaterThanOrEqual(0);
  });
});
