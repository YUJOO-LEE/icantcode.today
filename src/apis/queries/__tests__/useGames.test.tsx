import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { useStartGame, useSubmitScore, useRanking } from '../useGames';

describe('useStartGame', () => {
  it('returns sessionId from the API on success', async () => {
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useStartGame(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sessionId).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('surfaces network errors as isError', async () => {
    server.use(
      http.post(`${API_BASE_URL}/games/start`, () => HttpResponse.error()),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useStartGame(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSubmitScore', () => {
  it('returns the submitted record id on success', async () => {
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubmitScore(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        nickname: 'tester',
        score: 1234,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
  });

  it('passes the request payload to the server', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${API_BASE_URL}/games/die`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 42 }, { status: 201 });
      }),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubmitScore(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        sessionId: 'sid-x',
        nickname: 'koder',
        score: 99,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual({ sessionId: 'sid-x', nickname: 'koder', score: 99 });
  });

  it('marks isError when the server fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/games/die`, () => HttpResponse.error()),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubmitScore(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({
        sessionId: 'sid-x',
        nickname: 'koder',
        score: 1,
      });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('invalidates the ranking query on a successful submit so the new score shows up', async () => {
    let rankingHits = 0;
    server.use(
      http.get(`${API_BASE_URL}/games/ranking`, () => {
        rankingHits += 1;
        return HttpResponse.json({ list: [] });
      }),
      http.post(`${API_BASE_URL}/games/die`, () =>
        HttpResponse.json({ id: 7 }, { status: 201 }),
      ),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(
      () => ({ ranking: useRanking(), submit: useSubmitScore() }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.ranking.isSuccess).toBe(true));
    expect(rankingHits).toBe(1);

    await act(async () => {
      result.current.submit.mutate({ sessionId: 'sid-x', nickname: 'koder', score: 50 });
    });
    await waitFor(() => expect(result.current.submit.isSuccess).toBe(true));
    await waitFor(() => expect(rankingHits).toBe(2));
  });
});

describe('useRanking', () => {
  it('returns the ranking list from the API', async () => {
    server.use(
      http.get(`${API_BASE_URL}/games/ranking`, () =>
        HttpResponse.json({
          list: [
            { rank: 1, nickname: 'koder', score: 9999, playedAt: '2026-05-01T00:00:00Z' },
          ],
        }),
      ),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useRanking(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.list).toHaveLength(1);
    expect(result.current.data?.list[0]?.nickname).toBe('koder');
  });

  it('forwards the limit query param', async () => {
    let capturedLimit: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/games/ranking`, ({ request }) => {
        capturedLimit = new URL(request.url).searchParams.get('limit');
        return HttpResponse.json({ list: [] });
      }),
    );
    const { Wrapper } = createTestWrapper();
    renderHook(() => useRanking(5), { wrapper: Wrapper });
    await waitFor(() => expect(capturedLimit).toBe('5'));
  });
});
