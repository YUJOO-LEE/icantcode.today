import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import {
  useInfinitePostsQuery,
  useCreatePost,
  usePostsPolling,
} from '../usePosts';
import type { ReactNode } from 'react';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe('useInfinitePostsQuery', () => {
  it('returns page data and determines next page from totalCount', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));
        if (page === 0) {
          return HttpResponse.json({
            list: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              content: `post ${i + 1}`,
              author: 'u',
              commentCount: 0,
              createdAt: new Date().toISOString(),
            })),
            totalCount: 15,
          });
        }
        return HttpResponse.json({ list: [], totalCount: 15 });
      }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useInfinitePostsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.list).toHaveLength(10);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('returns hasNextPage false when all loaded', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, () =>
        HttpResponse.json({
          list: [
            { id: 1, content: 'only', author: 'u', commentCount: 0, createdAt: new Date().toISOString() },
          ],
          totalCount: 1,
        }),
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useInfinitePostsQuery(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('useCreatePost', () => {
  it('invalidates posts query on success', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => HttpResponse.json({ id: 99 })),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['posts'], { pages: [{ list: [], totalCount: 0 }], pageParams: [0] });

    const { result } = renderHook(() => useCreatePost(), { wrapper: Wrapper });

    let response: { id: number } | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        content: 'new',
        author: 'me',
        userCode: 'uid-1',
      });
    });

    expect(response).toEqual({ id: 99 });
    const state = client.getQueryState(['posts']);
    expect(state?.isInvalidated).toBe(true);
  });
});

describe('usePostsPolling', () => {
  it('fetches posts list when enabled', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, () =>
        HttpResponse.json({
          list: [
            { id: 2, content: 'new', author: 'u', commentCount: 0, createdAt: new Date().toISOString() },
            { id: 1, content: 'old', author: 'u', commentCount: 0, createdAt: new Date().toISOString() },
          ],
          totalCount: 2,
        }),
      ),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePostsPolling(true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data?.totalCount).toBe(2));
    expect(result.current.data?.list).toHaveLength(2);
  });

  it('is disabled (idle) when enabled=false', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePostsPolling(false), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
