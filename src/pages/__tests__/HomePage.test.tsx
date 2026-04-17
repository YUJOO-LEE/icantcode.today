import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
import { useThemeStore } from '@/stores/themeStore';
import HomePage from '../HomePage';
import type { ReactNode } from 'react';

import { API_BASE_URL } from '@/lib/constants';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </QueryClientProvider>
    );
  };
}

describe('HomePage', () => {
  beforeEach(() => {
    useStatusStore.setState({ apiStatus: 'checking', statusMessage: '', checkedAt: null });
  });

  it('shows checking view when status is checking', () => {
    render(<HomePage />, { wrapper: createWrapper() });
    expect(screen.getByText(/상태 확인 중/)).toBeInTheDocument();
  });

  it('shows landing view when API is normal', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: true,
          checkedAt: new Date().toISOString(),
          statusMessage: 'OK',
        });
      }),
    );

    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(
      () => {
        expect(screen.getByText(/Claude Code API가 정상입니다/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows feed area when API is down', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: false,
          checkedAt: new Date().toISOString(),
          statusMessage: 'Down',
        });
      }),
    );

    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('[ERR]')).toBeInTheDocument();
    });
  });

  it('updates document title based on status', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: false,
          checkedAt: new Date().toISOString(),
          statusMessage: 'Down',
        });
      }),
    );

    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(document.title).toMatch(/^\[DOWN\] icantcode\.today/);
    });
  });
});

describe('HomePage keyboard shortcuts', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'down',
      statusMessage: 'Down',
      checkedAt: new Date().toISOString(),
      models: [],
    });
    useThemeStore.setState({ theme: 'dark' });
    void i18n.changeLanguage('ko');
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () =>
        HttpResponse.json({
          canCode: false,
          checkedAt: new Date().toISOString(),
          statusMessage: 'Down',
        }),
      ),
      http.get(`${API_BASE_URL}/posts`, () => HttpResponse.json({ list: [], totalCount: 0 })),
    );
  });

  it('toggles composer open on KeyN', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: createWrapper() });
    await user.keyboard('n');
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/무슨 일이 있나요/)).toBeInTheDocument();
    });
  });

  it('KeyT toggles theme (dark → light)', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: createWrapper() });
    await user.keyboard('t');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('KeyL toggles language (ko → en)', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: createWrapper() });
    await user.keyboard('l');
    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });

  it('Escape closes the composer', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: createWrapper() });
    await user.keyboard('n');
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/무슨 일이 있나요/)).toBeInTheDocument(),
    );
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/무슨 일이 있나요/)).toBeNull();
    });
  });

  it('ignores shortcuts when an input is focused', async () => {
    const user = userEvent.setup();
    render(<HomePage />, { wrapper: createWrapper() });
    // open composer so textarea is available
    await user.keyboard('n');
    const textarea = await screen.findByPlaceholderText(/무슨 일이 있나요/);
    textarea.focus();

    useThemeStore.setState({ theme: 'dark' });
    await user.keyboard('t');
    // shortcut suppressed, theme unchanged
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
