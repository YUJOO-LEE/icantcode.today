import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Controllable HomePage mock — flip `mode` to exercise different App branches.
const state = { mode: 'throw' as 'throw' | 'suspend' | 'ok' };

vi.mock('@/pages/HomePage', () => ({
  default: function MockHome() {
    if (state.mode === 'throw') throw new Error('boom');
    if (state.mode === 'suspend') throw new Promise(() => {});
    return <div>mock-home-ok</div>;
  },
}));

describe('App ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders ErrorFallback when a child throws', { timeout: 15000 }, async () => {
    state.mode = 'throw';
    const { default: App } = await import('../App');
    render(<App />);
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
  });

  it('recovers when retry is clicked', { timeout: 15000 }, async () => {
    state.mode = 'throw';
    const { default: App } = await import('../App');
    render(<App />);
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();

    state.mode = 'ok';
    const user = userEvent.setup();
    await user.click(screen.getByText('[다시 시도]'));
    expect(screen.getByText('mock-home-ok')).toBeInTheDocument();
  });
});

describe('App LoadingFallback', () => {
  it('shows the loading fallback while a Suspense child is pending', { timeout: 15000 }, async () => {
    state.mode = 'suspend';
    const { default: App } = await import('../App');
    render(<App />);
    expect(screen.getByText(/loading/)).toBeInTheDocument();
  });
});
