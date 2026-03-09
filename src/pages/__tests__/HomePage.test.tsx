import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import { useStatusStore } from '@/stores/statusStore';
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
    await waitFor(() => {
      expect(screen.getByText('[OK]')).toBeInTheDocument();
    });
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
      expect(screen.getByText('[DOWN]')).toBeInTheDocument();
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
      expect(document.title).toBe('[DOWN] icantcode.today');
    });
  });
});
