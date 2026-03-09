import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect } from 'vitest';
import i18n from '@/lib/i18n';
import StatusIndicator from '../StatusIndicator';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('StatusIndicator', () => {
  it('renders normal status', () => {
    render(<StatusIndicator status="normal" />, { wrapper: Wrapper });
    expect(screen.getByText(/\[OK\]/)).toBeInTheDocument();
  });

  it('renders down status with pulse animation class', () => {
    const { container } = render(<StatusIndicator status="down" />, { wrapper: Wrapper });
    expect(screen.getByText(/\[DOWN\]/)).toBeInTheDocument();
    expect(container.querySelector('.status-dot-down')).toBeInTheDocument();
  });

  it('renders checking status', () => {
    render(<StatusIndicator status="checking" />, { wrapper: Wrapper });
    expect(screen.getByText(/\[\.\.\.\]/)).toBeInTheDocument();
  });

  it('has sr-only text for accessibility', () => {
    render(<StatusIndicator status="down" />, { wrapper: Wrapper });
    expect(screen.getByText('API 상태: DOWN')).toHaveClass('sr-only');
  });

  it('hides sr-only label when showLabel is false', () => {
    render(<StatusIndicator status="normal" showLabel={false} />, { wrapper: Wrapper });
    expect(screen.queryByText('API 상태: OK')).not.toBeInTheDocument();
  });
});
