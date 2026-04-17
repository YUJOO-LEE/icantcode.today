import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { useCommentsQuery, useCreateComment } from '../useComments';
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

describe('useCommentsQuery', () => {
  it('returns empty list when no comments', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts/1/comments`, () => HttpResponse.json([])),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCommentsQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns comments when data exists', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts/1/comments`, () =>
        HttpResponse.json([
          {
            id: 1,
            postId: 1,
            content: 'c1',
            author: 'a',
            createdAt: new Date().toISOString(),
          },
        ]),
      ),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCommentsQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.content).toBe('c1');
  });
});

describe('useCreateComment', () => {
  it('invalidates comments query and bumps commentCount on parent post', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/7/comments`, () =>
        HttpResponse.json({ id: 100 }),
      ),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['comments', 7], []);
    client.setQueryData<{ id: number; content: string; author: string; commentCount: number; createdAt: string }[]>(
      ['posts'],
      [{ id: 7, content: 'p', author: 'a', commentCount: 3, createdAt: new Date().toISOString() }],
    );

    const { result } = renderHook(() => useCreateComment(7), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ content: 'hi', author: 'me', userCode: 'u' });
    });

    const commentsState = client.getQueryState(['comments', 7]);
    expect(commentsState?.isInvalidated).toBe(true);

    const posts = client.getQueryData<{ id: number; commentCount: number }[]>(['posts']);
    expect(posts?.[0]?.commentCount).toBe(4);
  });
});
