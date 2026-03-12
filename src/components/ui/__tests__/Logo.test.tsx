import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Logo from '../Logo';

const mockUseReducedMotion = vi.fn();

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return {
    ...actual,
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

describe('Logo', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('renders an SVG element with role="img" and aria-label', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'icantcode.today logo');
  });

  it('uses default size of 48', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('accepts custom size prop', () => {
    const { container } = render(<Logo size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('uses CSS variable var(--logo) for stroke', () => {
    const { container } = render(<Logo />);
    const paths = container.querySelectorAll('path');
    paths.forEach((path) => {
      expect(path).toHaveAttribute('stroke', 'var(--logo)');
    });
  });

  it('merges additional className', () => {
    const { container } = render(<Logo className="opacity-50" />);
    const svg = container.querySelector('svg');
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain('opacity-50');
  });

  it('renders all SVG paths', () => {
    const { container } = render(<Logo />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(6);
  });

  it('does not animate by default', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('data-animated');
  });

  it('sets data-animated when animate is true', () => {
    const { container } = render(<Logo animate />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-animated', 'true');
  });

  it('does not set data-animated when reduced motion is preferred', () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { container } = render(<Logo animate />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('data-animated');
  });
});
