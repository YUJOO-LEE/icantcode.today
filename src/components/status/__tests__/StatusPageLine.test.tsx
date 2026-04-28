import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
import StatusPageLine from '../StatusPageLine';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('StatusPageLine', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'down',
      statusMessage: '',
      checkedAt: new Date().toISOString(),
      models: [],
      statusPage: null,
    });
  });

  it('renders nothing when statusPage is null', () => {
    const { container } = render(<StatusPageLine />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders description only (no indicator label) when indicator is none', () => {
    useStatusStore.setState({
      statusPage: {
        indicator: 'none',
        description: 'All Systems Operational',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    expect(screen.getByText(/status --page/)).toBeInTheDocument();
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
    // Healthy indicators must not surface a label, mirroring how
    // ModelStatusLine omits a [HEALTHY] badge for healthy models.
    expect(screen.queryByText(/\[OK\]/)).toBeNull();
    expect(screen.queryByText(/\[NONE\]/)).toBeNull();
  });

  it('renders [MINOR] badge with description for minor indicator', () => {
    useStatusStore.setState({
      statusPage: {
        indicator: 'minor',
        description: 'Partially Degraded Service',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    expect(screen.getByText(/\[MINOR\]/)).toBeInTheDocument();
    expect(screen.getByText(/Partially Degraded Service/)).toBeInTheDocument();
  });

  it('links to status.claude.com in a new tab with safe rel', () => {
    useStatusStore.setState({
      statusPage: {
        indicator: 'major',
        description: 'Major Outage',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://status.claude.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('shows the status --page shell prompt', () => {
    useStatusStore.setState({
      statusPage: {
        indicator: 'minor',
        description: 'Partially Degraded Service',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    expect(screen.getByText(/status --page/)).toBeInTheDocument();
  });

  it('applies indicator color when no model is FAIL', () => {
    useStatusStore.setState({
      models: [{ model: 'sonnet', status: 'HEALTHY', responseTimeMs: 1 }],
      statusPage: {
        indicator: 'minor',
        description: 'Partially Degraded Service',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    expect(screen.getByText(/\[MINOR\]/)).toHaveClass('text-warning');
  });

  it('falls back to muted color when any model is FAIL (model status takes priority)', () => {
    useStatusStore.setState({
      models: [
        { model: 'sonnet', status: 'HEALTHY', responseTimeMs: 1 },
        { model: 'opus', status: 'DOWN', responseTimeMs: 0 },
      ],
      statusPage: {
        indicator: 'minor',
        description: 'Partially Degraded Service',
        message: null,
        components: [],
      },
    });
    render(<StatusPageLine />, { wrapper: Wrapper });
    const indicatorSpan = screen.getByText(/\[MINOR\]/);
    expect(indicatorSpan).toHaveClass('text-muted-foreground');
    expect(indicatorSpan).not.toHaveClass('text-warning');
  });
});
