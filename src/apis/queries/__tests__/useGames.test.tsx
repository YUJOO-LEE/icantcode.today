import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { useStartGame, useSubmitScore } from '../useGames';

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
});
