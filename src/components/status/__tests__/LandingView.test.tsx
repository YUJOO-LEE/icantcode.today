import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
import LandingView from '../LandingView';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('LandingView', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'normal',
      statusMessage: 'OK',
      checkedAt: new Date().toISOString(),
      models: [],
    });
  });

  it('renders the /etc/motd prompt and [OK] label', () => {
    render(<LandingView />, { wrapper: Wrapper });
    expect(screen.getByText(/cat \/etc\/motd/)).toBeInTheDocument();
    expect(screen.getByText('[OK]')).toBeInTheDocument();
  });

  it('announces the api online label', () => {
    render(<LandingView />, { wrapper: Wrapper });
    expect(
      screen.getByLabelText(/Claude Code API가 정상입니다/),
    ).toBeInTheDocument();
  });

  it('renders the feed-only-on-outage footnote', () => {
    render(<LandingView />, { wrapper: Wrapper });
    expect(screen.getByText(/피드는 장애 시에만 열립니다/)).toBeInTheDocument();
  });
});
