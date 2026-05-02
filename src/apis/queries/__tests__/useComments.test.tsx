import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { createTestWrapper } from '@/tests/wrappers';
import { useCommentsQuery, useCreateComment } from '../useComments';
import type { PostListResponse, PostSummaryResponse } from '@/types/api';

type InfinitePostsCache = {
  pages: PostListResponse[];
  pageParams: number[];
};

function createWrapper() {
  // gcTime must be non-zero so test fixtures seeded via setQueryData (without
  // an active observer) survive long enough for assertions to read them.
  return createTestWrapper({
    queryClientConfig: {
      defaultOptions: {
        queries: { retry: false, gcTime: 60_000 },
        mutations: { retry: false },
      },
    },
  });
}

function buildPost(overrides: Partial<PostSummaryResponse> = {}): PostSummaryResponse {
  return {
    id: 1,
    content: 'p',
    author: 'a',
    commentCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
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

describe('useCreateComment cache update', () => {
  // Regression coverage: in production the `['posts']` cache is shaped by
  // `useInfiniteQuery` ({ pages, pageParams }) rather than a flat array.
  // The previous updater called `.map` on the wrong shape and threw inside
  // setQueriesData, which react-query reported back to the caller as an
  // onError — surfacing a "submission failed" alert despite the POST having
  // succeeded server-side.

  it('does not throw when applied to the infinite-query posts cache', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/7/comments`, () =>
        HttpResponse.json({ id: 100 }),
      ),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['comments', 7], []);
    client.setQueryData<InfinitePostsCache>(['posts'], {
      pages: [
        { list: [buildPost({ id: 7, commentCount: 3 })], totalCount: 1 },
      ],
      pageParams: [0],
    });

    const { result } = renderHook(() => useCreateComment(7), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ content: 'hi', author: 'me', userCode: 'u' });
    });

    const cache = client.getQueryData<InfinitePostsCache>(['posts']);
    expect(cache?.pages[0]?.list[0]?.commentCount).toBe(4);
  });

  it('also updates the flat polling cache shape under [posts, poll]', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/7/comments`, () =>
        HttpResponse.json({ id: 100 }),
      ),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['comments', 7], []);
    // Both caches coexist in production: the infinite list and the polling
    // snapshot. setQueriesData with a `['posts']` prefix matches both, so the
    // updater must handle each shape — otherwise it crashes the mutation.
    client.setQueryData<InfinitePostsCache>(['posts'], {
      pages: [{ list: [buildPost({ id: 7, commentCount: 3 })], totalCount: 1 }],
      pageParams: [0],
    });
    client.setQueryData<PostListResponse>(['posts', 'poll'], {
      list: [buildPost({ id: 7, commentCount: 3 })],
      totalCount: 1,
    });

    const { result } = renderHook(() => useCreateComment(7), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ content: 'hi', author: 'me', userCode: 'u' });
    });

    const infinite = client.getQueryData<InfinitePostsCache>(['posts']);
    const polling = client.getQueryData<PostListResponse>(['posts', 'poll']);
    expect(infinite?.pages[0]?.list[0]?.commentCount).toBe(4);
    expect(polling?.list[0]?.commentCount).toBe(4);
  });

  it('mutation resolves successfully — does not surface a phantom onError when the cache update succeeds', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/7/comments`, () =>
        HttpResponse.json({ id: 100 }),
      ),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['comments', 7], []);
    client.setQueryData<InfinitePostsCache>(['posts'], {
      pages: [{ list: [buildPost({ id: 7, commentCount: 0 })], totalCount: 1 }],
      pageParams: [0],
    });

    const { result } = renderHook(() => useCreateComment(7), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ content: 'hi', author: 'me', userCode: 'u' });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('invalidates the comments query so the thread refetches', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/7/comments`, () =>
        HttpResponse.json({ id: 100 }),
      ),
    );

    const { Wrapper, client } = createWrapper();
    client.setQueryData(['comments', 7], []);
    client.setQueryData<InfinitePostsCache>(['posts'], {
      pages: [{ list: [buildPost({ id: 7 })], totalCount: 1 }],
      pageParams: [0],
    });

    const { result } = renderHook(() => useCreateComment(7), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ content: 'hi', author: 'me', userCode: 'u' });
    });

    expect(client.getQueryState(['comments', 7])?.isInvalidated).toBe(true);
  });
});
