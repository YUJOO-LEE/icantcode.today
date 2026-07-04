import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getNotificationPermission,
  urlBase64ToUint8Array,
  registerServiceWorker,
  ensurePushRegistration,
  requestNotificationPermission,
  getServiceWorkerRegistration,
  subscribeToPush,
  getExistingPushSubscription,
} from '../push';

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    get: () => ua,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  // Restore a neutral UA so later tests are unaffected.
  setUserAgent('Mozilla/5.0 (test)');
});

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string into the expected bytes', () => {
    // "hello" -> base64url "aGVsbG8"
    const bytes = urlBase64ToUint8Array('aGVsbG8');
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it('handles base64url-specific characters (- and _)', () => {
    // bytes [251, 255] -> base64 "+/8=" -> base64url "-_8"
    const bytes = urlBase64ToUint8Array('-_8');
    expect(Array.from(bytes)).toEqual([251, 255]);
  });

  it('returns a Uint8Array', () => {
    expect(urlBase64ToUint8Array('aGVsbG8')).toBeInstanceOf(Uint8Array);
  });
});

describe('isIOS', () => {
  it('detects iPhone', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari');
    expect(isIOS()).toBe(true);
  });

  it('detects iPad', () => {
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) Safari');
    expect(isIOS()).toBe(true);
  });

  it('returns false for Android', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14) Chrome');
    expect(isIOS()).toBe(false);
  });

  it('returns false for desktop Chrome', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome');
    expect(isIOS()).toBe(false);
  });
});

describe('getNotificationPermission', () => {
  it('returns "unsupported" when Notification is absent', () => {
    vi.stubGlobal('Notification', undefined);
    expect(getNotificationPermission()).toBe('unsupported');
  });

  it('returns the current permission when supported', () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    expect(getNotificationPermission()).toBe('granted');
  });
});

describe('isStandalone', () => {
  it('returns true when display-mode is standalone', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }),
    );
    expect(isStandalone()).toBe(true);
  });

  it('returns false in a normal browser tab', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: false }),
    );
    expect(isStandalone()).toBe(false);
  });

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(isStandalone()).toBe(false);
  });
});

describe('isPushSupported', () => {
  it('returns false when the push APIs are unavailable (jsdom default)', () => {
    // jsdom implements neither ServiceWorker nor PushManager, so the feature
    // check naturally fails — this mirrors an unsupported browser.
    expect(isPushSupported()).toBe(false);
  });

  it('returns true when serviceWorker, PushManager and Notification all exist', () => {
    const hadSW = 'serviceWorker' in navigator;
    const hadPM = 'PushManager' in window;
    const hadN = 'Notification' in window;
    if (!hadSW) {
      Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
    }
    if (!hadPM) {
      Object.defineProperty(window, 'PushManager', { configurable: true, value: function () {} });
    }
    if (!hadN) {
      Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'default' } });
    }

    expect(isPushSupported()).toBe(true);

    if (!hadSW) delete (navigator as unknown as Record<string, unknown>).serviceWorker;
    if (!hadPM) delete (window as unknown as Record<string, unknown>).PushManager;
    if (!hadN) delete (window as unknown as Record<string, unknown>).Notification;
  });
});

describe('isIOS (iPadOS 13+ desktop-UA fallback)', () => {
  function setMaxTouchPoints(value: number) {
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value });
  }

  afterEach(() => setMaxTouchPoints(0));

  it('detects a touch-capable Mac (iPadOS reporting as macOS)', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari');
    setMaxTouchPoints(5);
    expect(isIOS()).toBe(true);
  });

  it('returns false for a Mac without touch', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari');
    setMaxTouchPoints(0);
    expect(isIOS()).toBe(false);
  });
});

describe('isStandalone (iOS navigator.standalone)', () => {
  it('returns true via the iOS navigator.standalone flag', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true });
    expect(isStandalone()).toBe(true);
    delete (window.navigator as unknown as Record<string, unknown>).standalone;
  });
});

describe('service worker + push wrappers', () => {
  function installServiceWorkerMock(overrides: Record<string, unknown> = {}) {
    const subscription = { endpoint: 'https://push.example.com/x' };
    const registration = {
      pushManager: {
        subscribe: vi.fn(async () => subscription),
        getSubscription: vi.fn(async () => subscription),
      },
    };
    const sw = {
      register: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(async () => registration),
      ...overrides,
    };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: sw });
    return { sw, registration, subscription };
  }

  function removeServiceWorker() {
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  }

  it('registerServiceWorker registers /sw.js', async () => {
    const { sw, registration } = installServiceWorkerMock();
    await expect(registerServiceWorker()).resolves.toBe(registration);
    expect(sw.register).toHaveBeenCalledWith('/sw.js');
    removeServiceWorker();
  });

  it('ensurePushRegistration resolves the ready registration', async () => {
    const { sw, registration } = installServiceWorkerMock();
    await expect(ensurePushRegistration()).resolves.toBe(registration);
    expect(sw.register).toHaveBeenCalled();
    removeServiceWorker();
  });

  it('requestNotificationPermission delegates to Notification.requestPermission', async () => {
    vi.stubGlobal('Notification', { requestPermission: vi.fn(async () => 'granted') });
    await expect(requestNotificationPermission()).resolves.toBe('granted');
  });

  it('getServiceWorkerRegistration returns null when serviceWorker is unavailable', async () => {
    removeServiceWorker();
    await expect(getServiceWorkerRegistration()).resolves.toBeNull();
  });

  it('getServiceWorkerRegistration returns the active registration', async () => {
    const { registration } = installServiceWorkerMock();
    await expect(getServiceWorkerRegistration()).resolves.toBe(registration);
    removeServiceWorker();
  });

  it('getServiceWorkerRegistration coerces a missing registration to null', async () => {
    installServiceWorkerMock({ getRegistration: vi.fn(async () => undefined) });
    await expect(getServiceWorkerRegistration()).resolves.toBeNull();
    removeServiceWorker();
  });

  it('subscribeToPush subscribes with the VAPID key', async () => {
    const { registration, subscription } = installServiceWorkerMock();
    await expect(subscribeToPush(registration as never, 'aGVsbG8')).resolves.toBe(subscription);
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    );
    removeServiceWorker();
  });

  it('getExistingPushSubscription reads the current subscription', async () => {
    const { registration, subscription } = installServiceWorkerMock();
    await expect(getExistingPushSubscription(registration as never)).resolves.toBe(subscription);
    removeServiceWorker();
  });
});
