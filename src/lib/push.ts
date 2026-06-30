/**
 * Web Push + PWA install capability helpers.
 *
 * No external dependencies: everything here is plain Browser API access plus a
 * couple of pure transforms. Orchestration (permission flow, backend sync)
 * lives in `usePushNotifications`; this module only exposes thin, individually
 * testable primitives.
 */

/** True when the browser can register a service worker AND show push notifications. */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** True on iPhone/iPad/iPod, including iPadOS 13+ which masquerades as macOS. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ reports a desktop Safari UA; fall back to a touch-capable Mac.
  return /macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
}

/** True when running as an installed PWA (home-screen / standalone window). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  // iOS Safari exposes a non-standard `navigator.standalone` instead.
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

/** Current Notification permission, or `'unsupported'` when the API is absent. */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/**
 * Decode a base64url-encoded VAPID public key into the `Uint8Array` that
 * `PushManager.subscribe({ applicationServerKey })` requires.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/** Register the push/notification service worker (served from the site root). */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js');
}

/** Register the worker and resolve once it is active and ready to subscribe. */
export async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  await registerServiceWorker();
  return navigator.serviceWorker.ready;
}

/** Prompt the user for notification permission. */
export function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

/** The active registration if one already exists, otherwise `null`. */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

/** Create a new push subscription bound to the given VAPID public key. */
export function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string,
): Promise<PushSubscription> {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

/** The existing push subscription for this registration, or `null`. */
export function getExistingPushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  return registration.pushManager.getSubscription();
}
