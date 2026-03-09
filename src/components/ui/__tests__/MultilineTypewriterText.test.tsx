import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MultilineTypewriterText from '../MultilineTypewriterText';

describe('MultilineTypewriterText', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    // Default: no reduced motion
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders only the first line initially', () => {
    render(<MultilineTypewriterText lines={['First line', 'Second line']} speed={10} />);

    // Second line should not be in the DOM yet
    expect(screen.queryByText('Second line')).not.toBeInTheDocument();
  });

  it('renders second line after first line completes', async () => {
    render(<MultilineTypewriterText lines={['Hi', 'Bye']} speed={10} />);

    // Wait for first line to complete and second to appear
    await waitFor(() => {
      expect(screen.getByText(/Bye/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('resets when lines prop changes (language switch)', async () => {
    const { rerender } = render(
      <MultilineTypewriterText lines={['Hello', 'World']} speed={10} />
    );

    // Wait for both lines to render
    await waitFor(() => {
      expect(screen.getByText(/World/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Change lines (simulate language switch)
    rerender(
      <MultilineTypewriterText lines={['안녕', '세계']} speed={10} />
    );

    // Old text should be gone, new first line should start typing
    expect(screen.queryByText(/World/)).not.toBeInTheDocument();
    expect(screen.queryByText(/세계/)).not.toBeInTheDocument();

    // Eventually new lines should appear
    await waitFor(() => {
      expect(screen.getByText(/세계/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows all lines immediately when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<MultilineTypewriterText lines={['Line A', 'Line B', 'Line C']} speed={1000} />);

    expect(screen.getByText(/Line A/)).toBeInTheDocument();
    expect(screen.getByText(/Line B/)).toBeInTheDocument();
    expect(screen.getByText(/Line C/)).toBeInTheDocument();
  });

  it('renders linePrefix before each line', async () => {
    render(
      <MultilineTypewriterText lines={['Hello', 'World']} speed={10} linePrefix=">" />
    );

    // First line prefix should be visible
    const prefixes = screen.getAllByText('>');
    expect(prefixes.length).toBeGreaterThanOrEqual(1);

    // After both lines complete, two prefixes
    await waitFor(() => {
      const allPrefixes = screen.getAllByText('>');
      expect(allPrefixes).toHaveLength(2);
    }, { timeout: 3000 });
  });

  it('calls onComplete after the last line finishes', async () => {
    const onComplete = vi.fn();

    render(
      <MultilineTypewriterText lines={['A', 'B']} speed={10} onComplete={onComplete} />
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('skips empty lines', async () => {
    const onComplete = vi.fn();

    render(
      <MultilineTypewriterText lines={['Hello', '', 'World']} speed={10} onComplete={onComplete} />
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Only non-empty lines should render
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/World/)).toBeInTheDocument();
  });
});
