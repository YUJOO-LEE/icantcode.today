import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VAPID_PUBLIC_KEY } from '@/lib/constants';
import {
  isPushSupported,
  isIOS,
  isStandalone,
  getNotificationPermission,
  getServiceWorkerRegistration,
  getExistingPushSubscription,
  ensurePushRegistration,
  requestNotificationPermission,
  subscribeToPush,
} from '@/lib/push';
import { useSubscribePush, useUnsubscribePush } from '@/apis/queries/usePushSubscription';
import type { WebPushSubscriptionJSON } from '@/types/api';

/**
 * Notification opt-in lifecycle state.
 * - `unsupported`   — browser can't do Web Push, or the feature is unconfigured.
 * - `needs-install` — iOS only delivers push to a home-screen PWA; not installed yet.
 * - `default`       — supported and idle; the user can opt in.
 * - `subscribing`   — opt-in in progress.
 * - `subscribed`    — permission granted and registered with the backend.
 * - `denied`        — the user blocked notifications at the browser level.
 */
export type PushStatus =
  | 'unsupported'
  | 'needs-install'
  | 'default'
  | 'subscribing'
  | 'subscribed'
  | 'denied';

export interface UsePushNotifications {
  status: PushStatus;
  /** Whether the opt-in UI should render at all. */
  isSupported: boolean;
  /** True while running on iOS Safari outside an installed PWA. */
  needsInstall: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  error: string | null;
}

export function usePushNotifications(): UsePushNotifications {
  const { i18n } = useTranslation();
  const subscribeMutation = useSubscribePush();
  const unsubscribeMutation = useUnsubscribePush();

  // Feature is available only when the browser supports push AND the backend
  // VAPID key is configured; otherwise the opt-in stays hidden.
  const isSupported = isPushSupported() && Boolean(VAPID_PUBLIC_KEY);

  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function resolveInitialStatus() {
      if (!isSupported) {
        setStatus('unsupported');
        return;
      }
      if (isIOS() && !isStandalone()) {
        setStatus('needs-install');
        return;
      }
      const permission = getNotificationPermission();
      if (permission === 'denied') {
        setStatus('denied');
        return;
      }
      if (permission === 'granted') {
        const registration = await getServiceWorkerRegistration();
        const existing = registration ? await getExistingPushSubscription(registration) : null;
        if (active) setStatus(existing ? 'subscribed' : 'default');
        return;
      }
      if (active) setStatus('default');
    }
    void resolveInitialStatus();
    return () => {
      active = false;
    };
  }, [isSupported]);

  const enable = useCallback(async () => {
    setError(null);
    // iOS without an installed PWA can't receive push — surface the install step.
    if (isIOS() && !isStandalone()) {
      setStatus('needs-install');
      return;
    }
    setStatus('subscribing');
    try {
      const registration = await ensurePushRegistration();
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default');
        return;
      }
      const subscription = await subscribeToPush(registration, VAPID_PUBLIC_KEY);
      await subscribeMutation.mutateAsync({
        subscription: subscription.toJSON() as WebPushSubscriptionJSON,
        lang: i18n.language === 'en' ? 'en' : 'ko',
      });
      setStatus('subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('default');
    }
  }, [subscribeMutation, i18n.language]);

  const disable = useCallback(async () => {
    setError(null);
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = registration
        ? await getExistingPushSubscription(registration)
        : null;
      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint });
      }
      setStatus('default');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [unsubscribeMutation]);

  return {
    status,
    isSupported,
    needsInstall: status === 'needs-install',
    enable,
    disable,
    error,
  };
}
