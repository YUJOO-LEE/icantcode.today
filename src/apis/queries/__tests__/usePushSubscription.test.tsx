import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { useSubscribePush, useUnsubscribePush } from '../usePushSubscription';
import type { PushSubscribeRequest } from '@/types/api';

const SAMPLE: PushSubscribeRequest = {
  subscription: {
    endpoint: 'https://push.example.com/abc',
    expirationTime: null,
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  },
  lang: 'ko',
};

describe('useSubscribePush', () => {
  it('posts the subscription and resolves ok on success', async () => {
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubscribePush(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(SAMPLE);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.ok).toBe(true);
  });

  it('sends the subscription payload to /push/subscribe', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${API_BASE_URL}/push/subscribe`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubscribePush(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(SAMPLE);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual(SAMPLE);
  });

  it('marks isError when the server fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/push/subscribe`, () => HttpResponse.error()),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useSubscribePush(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate(SAMPLE);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUnsubscribePush', () => {
  it('posts the endpoint to /push/unsubscribe', async () => {
    let capturedBody: unknown;
    server.use(
      http.post(`${API_BASE_URL}/push/unsubscribe`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => useUnsubscribePush(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ endpoint: 'https://push.example.com/abc' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual({ endpoint: 'https://push.example.com/abc' });
  });
});
