import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TypewriterText from '../TypewriterText';

describe('TypewriterText', () => {
  it('eventually displays full text', async () => {
    render(<TypewriterText text="Hello World" speed={10} />);
    await waitFor(() => {
      expect(screen.getByText(/Hello World/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows text immediately when reduced motion is preferred', () => {
    // Mock matchMedia for reduced motion
    const originalMatchMedia = window.matchMedia;
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

    render(<TypewriterText text="Instant text" speed={1000} />);
    expect(screen.getByText('Instant text')).toBeInTheDocument();

    window.matchMedia = originalMatchMedia;
  });
});
