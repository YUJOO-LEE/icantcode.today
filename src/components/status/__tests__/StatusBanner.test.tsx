import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
import StatusBanner from '../StatusBanner';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('StatusBanner', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'down',
      statusMessage: 'down',
      checkedAt: new Date().toISOString(),
      models: [],
    });
  });

  it('renders [ERR] + down message when status is down', () => {
    render(<StatusBanner status="down" />, { wrapper: Wrapper });
    expect(screen.getByText('[ERR]')).toBeInTheDocument();
    expect(screen.getByText(/장애가 감지되었습니다/)).toBeInTheDocument();
  });

  it('is a polite aria-live region', () => {
    render(<StatusBanner status="down" />, { wrapper: Wrapper });
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('renders nothing when status is normal', () => {
    const { container } = render(<StatusBanner status="normal" />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when status is checking', () => {
    const { container } = render(<StatusBanner status="checking" />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });
});
