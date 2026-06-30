/*
 * icantcode.today service worker.
 *
 * Scope is intentionally narrow: receive Web Push messages and show/handle
 * notifications. There is deliberately NO fetch handler and NO offline cache —
 * the app is prerendered + SPA-routed, and caching here would risk serving
 * stale HTML. This worker exists purely to keep notifications alive when the
 * PWA (or tab) is closed.
 */

self.addEventListener('install', () => {
  // Replace any previous worker immediately rather than waiting for old clients.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Start controlling open pages as soon as this worker activates.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'icantcode.today';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    // A stable tag means a newer status update replaces the previous one
    // instead of stacking duplicates; renotify still alerts the user.
    tag: payload.tag || 'claude-status',
    renotify: true,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && client.url !== targetUrl) {
              client.navigate(targetUrl).catch(() => {});
            }
            return undefined;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
