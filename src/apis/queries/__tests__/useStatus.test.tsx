import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { useStatusQuery } from '../useStatus';
import { useStatusStore } from '@/stores/statusStore';
import type { ReactNode } from 'react';

import { API_BASE_URL } from '@/lib/constants';

function createWrapper() {
  const testClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useStatusQuery', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'checking',
      statusMessage: '',
      checkedAt: null,
    });
  });

  it('fetches status and updates store when API is up', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: true,
          checkedAt: '2026-03-09T12:00:00Z',
          statusMessage: 'All systems operational',
        });
      }),
    );

    const { result } = renderHook(() => useStatusQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const store = useStatusStore.getState();
    expect(store.apiStatus).toBe('normal');
    expect(store.statusMessage).toBe('All systems operational');
  });

  it('sets status to down when API reports canCode false', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: false,
          checkedAt: '2026-03-09T12:00:00Z',
          statusMessage: 'API is down',
        });
      }),
    );

    const { result } = renderHook(() => useStatusQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useStatusStore.getState().apiStatus).toBe('down');
  });

  it('sets status to down on network error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.error();
      }),
    );

    const { result } = renderHook(() => useStatusQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useStatusStore.getState().apiStatus).toBe('down');
  });
});
