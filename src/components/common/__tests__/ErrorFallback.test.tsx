import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi } from 'vitest';
import i18n from '@/lib/i18n';
import ErrorFallback from '../ErrorFallback';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('ErrorFallback', () => {
  it('renders error badge and message', () => {
    render(<ErrorFallback />, { wrapper: Wrapper });
    expect(screen.getByText('[ERR]')).toBeInTheDocument();
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
  });

  it('displays error details when provided', () => {
    render(<ErrorFallback error={new Error('Something broke')} />, { wrapper: Wrapper });
    expect(screen.getByText(/Something broke/)).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /다시 시도/ }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has role="alert" for accessibility', () => {
    render(<ErrorFallback />, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
