import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStatusStore } from '@/stores/statusStore';
import { createTestWrapper } from '@/tests/wrappers';
import LandingView from '../LandingView';

// LandingView now embeds NotificationButton, whose push hook calls
// useMutation — so a QueryClient (plus i18n) must wrap it.
const { Wrapper } = createTestWrapper({ withI18n: true });

describe('LandingView', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'normal',
      statusMessage: 'OK',
      checkedAt: new Date().toISOString(),
      models: [],
      statusPage: null,
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

  it('mounts StatusPageLine when statusPage is present, even on the OK landing', () => {
    useStatusStore.setState({
      statusPage: {
        indicator: 'none',
        description: 'All Systems Operational',
        message: null,
        components: [],
      },
    });
    render(<LandingView />, { wrapper: Wrapper });
    expect(screen.getByText(/status --page/)).toBeInTheDocument();
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });
});
