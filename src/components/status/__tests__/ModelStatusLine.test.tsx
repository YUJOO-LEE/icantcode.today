import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
import ModelStatusLine from '../ModelStatusLine';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('ModelStatusLine', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'normal',
      statusMessage: '',
      checkedAt: null,
      models: [],
    });
  });

  it('renders nothing when models list is empty', () => {
    const { container } = render(<ModelStatusLine />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders each healthy model name without FAIL tag', () => {
    useStatusStore.setState({
      models: [
        { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1000 },
        { model: 'claude-opus-4-6', status: 'HEALTHY', responseTimeMs: 2000 },
      ],
    });
    render(<ModelStatusLine />, { wrapper: Wrapper });
    expect(screen.getByText('claude-sonnet-4-6')).toBeInTheDocument();
    expect(screen.getByText('claude-opus-4-6')).toBeInTheDocument();
    expect(screen.queryByText(/\[FAIL\]/)).toBeNull();
  });

  it('renders [FAIL] for unhealthy models', () => {
    useStatusStore.setState({
      models: [
        { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1000 },
        { model: 'claude-opus-4-6', status: 'DOWN', responseTimeMs: 0 },
      ],
    });
    render(<ModelStatusLine />, { wrapper: Wrapper });
    expect(screen.getByText(/\[FAIL\]/)).toBeInTheDocument();
  });

  it('inserts a middot separator between models', () => {
    useStatusStore.setState({
      models: [
        { model: 'a', status: 'HEALTHY', responseTimeMs: 1 },
        { model: 'b', status: 'HEALTHY', responseTimeMs: 1 },
        { model: 'c', status: 'HEALTHY', responseTimeMs: 1 },
      ],
    });
    render(<ModelStatusLine />, { wrapper: Wrapper });
    const separators = screen.getAllByText('·');
    expect(separators).toHaveLength(2);
  });

  it('includes the status --models shell prompt', () => {
    useStatusStore.setState({
      models: [{ model: 'x', status: 'HEALTHY', responseTimeMs: 1 }],
    });
    render(<ModelStatusLine />, { wrapper: Wrapper });
    expect(screen.getByText(/status --models/)).toBeInTheDocument();
  });
});
