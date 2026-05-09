import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import AppShell from '../AppShell';

function Boom({ shouldThrow }: { shouldThrow: boolean }): ReactNode {
  if (shouldThrow) throw new Error('boom');
  return <div>safe-child</div>;
}

describe('AppShell ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <AppShell>
        <Boom shouldThrow={false} />
      </AppShell>,
    );
    expect(screen.getByText('safe-child')).toBeInTheDocument();
  });

  it('catches a render-time error and shows the ErrorFallback', () => {
    render(
      <AppShell>
        <Boom shouldThrow={true} />
      </AppShell>,
    );
    // ErrorFallback renders the i18n message — match the Korean copy.
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('recovers when retry resets the boundary state', async () => {
    function App({ shouldThrow }: { shouldThrow: boolean }) {
      return (
        <AppShell>
          <Boom shouldThrow={shouldThrow} />
        </AppShell>
      );
    }
    const { rerender } = render(<App shouldThrow={true} />);
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();

    rerender(<App shouldThrow={false} />);
    await userEvent.setup().click(screen.getByText('[다시 시도]'));
    expect(screen.getByText('safe-child')).toBeInTheDocument();
  });

  it('renders the screen-reader status announcer region', () => {
    const { container } = render(
      <AppShell>
        <div>child</div>
      </AppShell>,
    );
    const sr = container.querySelector('[aria-live="polite"]');
    expect(sr).not.toBeNull();
    expect(sr?.classList.contains('sr-only')).toBe(true);
  });
});
