import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import i18n from '@/lib/i18n';

// The hook gates on a configured VAPID key; provide one for the test graph.
vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/constants')>('@/lib/constants');
  return { ...actual, VAPID_PUBLIC_KEY: 'test-vapid-key' };
});

// Mock the browser-API layer so the hook's orchestration is testable in jsdom.
vi.mock('@/lib/push', () => ({
  isPushSupported: vi.fn(() => true),
  isIOS: vi.fn(() => false),
  isStandalone: vi.fn(() => false),
  getNotificationPermission: vi.fn(() => 'default' as NotificationPermission),
  getServiceWorkerRegistration: vi.fn(async () => null),
  getExistingPushSubscription: vi.fn(async () => null),
  ensurePushRegistration: vi.fn(async () => ({}) as ServiceWorkerRegistration),
  requestNotificationPermission: vi.fn(async () => 'granted' as NotificationPermission),
  subscribeToPush: vi.fn(async () => ({
    endpoint: 'https://push.example.com/abc',
    toJSON: () => ({
      endpoint: 'https://push.example.com/abc',
      expirationTime: null,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
    unsubscribe: vi.fn(async () => true),
  })),
}));

import * as push from '@/lib/push';
import { usePushNotifications } from '../usePushNotifications';

const mocked = vi.mocked(push);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.isPushSupported.mockReturnValue(true);
  mocked.isIOS.mockReturnValue(false);
  mocked.isStandalone.mockReturnValue(false);
  mocked.getNotificationPermission.mockReturnValue('default');
  mocked.getServiceWorkerRegistration.mockResolvedValue(null);
  mocked.getExistingPushSubscription.mockResolvedValue(null);
  mocked.ensurePushRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
  mocked.requestNotificationPermission.mockResolvedValue('granted');
});

describe('usePushNotifications — initial status', () => {
  it('is unsupported when the browser lacks push', async () => {
    mocked.isPushSupported.mockReturnValue(false);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('unsupported'));
    expect(result.current.isSupported).toBe(false);
  });

  it('is needs-install on iOS Safari outside an installed PWA', async () => {
    mocked.isIOS.mockReturnValue(true);
    mocked.isStandalone.mockReturnValue(false);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('needs-install'));
    expect(result.current.needsInstall).toBe(true);
  });

  it('is default when supported and permission not yet decided', async () => {
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));
  });

  it('is denied when notifications are blocked', async () => {
    mocked.getNotificationPermission.mockReturnValue('denied');
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('is subscribed when permission granted and a subscription already exists', async () => {
    mocked.getNotificationPermission.mockReturnValue('granted');
    mocked.getServiceWorkerRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
    mocked.getExistingPushSubscription.mockResolvedValue({
      endpoint: 'x',
    } as PushSubscription);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('subscribed'));
  });

  it('is default when permission granted but no subscription exists yet', async () => {
    mocked.getNotificationPermission.mockReturnValue('granted');
    mocked.getServiceWorkerRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
    mocked.getExistingPushSubscription.mockResolvedValue(null);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));
  });
});

describe('usePushNotifications — enable()', () => {
  it('subscribes and reaches subscribed on the happy path', async () => {
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    expect(mocked.subscribeToPush).toHaveBeenCalledWith({}, 'test-vapid-key');
    await waitFor(() => expect(result.current.status).toBe('subscribed'));
  });

  it('goes to denied when the user blocks the permission prompt', async () => {
    mocked.requestNotificationPermission.mockResolvedValue('denied');
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    expect(mocked.subscribeToPush).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('routes to needs-install when called on iOS outside a PWA', async () => {
    mocked.isIOS.mockReturnValue(true);
    mocked.isStandalone.mockReturnValue(false);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('needs-install'));

    await act(async () => {
      await result.current.enable();
    });

    expect(mocked.ensurePushRegistration).not.toHaveBeenCalled();
    expect(result.current.status).toBe('needs-install');
  });

  it('records an error and falls back to default when subscribing throws', async () => {
    mocked.ensurePushRegistration.mockRejectedValue(new Error('sw boom'));
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => expect(result.current.error).toBe('sw boom'));
    expect(result.current.status).toBe('default');
  });

  it('returns to default when permission stays "default" (prompt dismissed)', async () => {
    mocked.requestNotificationPermission.mockResolvedValue('default');
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    expect(mocked.subscribeToPush).not.toHaveBeenCalled();
    expect(result.current.status).toBe('default');
  });

  it('stringifies a non-Error throw into the error message', async () => {
    mocked.ensurePushRegistration.mockRejectedValue('plain boom');
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => expect(result.current.error).toBe('plain boom'));
  });

  it('sends lang=en when the UI language is English', async () => {
    let body: { lang?: string } | undefined;
    server.use(
      http.post(`${API_BASE_URL}/push/subscribe`, async ({ request }) => {
        body = (await request.json()) as { lang?: string };
        return HttpResponse.json({ ok: true });
      }),
    );
    await i18n.changeLanguage('en');
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('default'));

    await act(async () => {
      await result.current.enable();
    });

    await waitFor(() => expect(result.current.status).toBe('subscribed'));
    expect(body?.lang).toBe('en');
    await i18n.changeLanguage('ko');
  });
});

describe('usePushNotifications — disable()', () => {
  it('unsubscribes the browser and returns to default', async () => {
    const unsubscribe = vi.fn(async () => true);
    mocked.getNotificationPermission.mockReturnValue('granted');
    mocked.getServiceWorkerRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
    mocked.getExistingPushSubscription.mockResolvedValue({
      endpoint: 'https://push.example.com/abc',
      unsubscribe,
    } as unknown as PushSubscription);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('subscribed'));

    await act(async () => {
      await result.current.disable();
    });

    expect(unsubscribe).toHaveBeenCalled();
    await waitFor(() => expect(result.current.status).toBe('default'));
  });

  it('no-ops cleanly when there is no existing subscription', async () => {
    mocked.getServiceWorkerRegistration.mockResolvedValue(null);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.disable();
    });

    await waitFor(() => expect(result.current.status).toBe('default'));
  });

  it('records an error when unsubscribing throws', async () => {
    mocked.getNotificationPermission.mockReturnValue('granted');
    mocked.getServiceWorkerRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
    mocked.getExistingPushSubscription.mockResolvedValue({
      endpoint: 'https://push.example.com/abc',
      unsubscribe: vi.fn(async () => {
        throw new Error('unsub boom');
      }),
    } as unknown as PushSubscription);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('subscribed'));

    await act(async () => {
      await result.current.disable();
    });

    await waitFor(() => expect(result.current.error).toBe('unsub boom'));
  });

  it('stringifies a non-Error throw while disabling', async () => {
    mocked.getNotificationPermission.mockReturnValue('granted');
    mocked.getServiceWorkerRegistration.mockResolvedValue({} as ServiceWorkerRegistration);
    mocked.getExistingPushSubscription.mockResolvedValue({
      endpoint: 'https://push.example.com/abc',
      unsubscribe: vi.fn().mockRejectedValue('raw disable boom'),
    } as unknown as PushSubscription);
    const { Wrapper } = createTestWrapper();
    const { result } = renderHook(() => usePushNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('subscribed'));

    await act(async () => {
      await result.current.disable();
    });

    await waitFor(() => expect(result.current.error).toBe('raw disable boom'));
  });
});
