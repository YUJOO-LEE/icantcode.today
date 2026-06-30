import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import IOSInstallGuide from './IOSInstallGuide';

/**
 * Terminal-styled opt-in for Web Push status alerts. Renders nothing unless the
 * browser supports push and the backend VAPID key is configured. On iOS Safari
 * (outside an installed PWA) the click opens an install guide instead.
 *
 * Install is never a competing action: on Chromium it surfaces only as an
 * optional "add to home screen" nudge AFTER alerts are enabled.
 */
function NotificationButton() {
  const { t } = useTranslation('status');
  const { status, isSupported, enable, disable, error } = usePushNotifications();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  if (!isSupported) return null;

  if (status === 'denied') {
    return (
      <p className="text-xs text-muted-foreground/70">
        <span aria-hidden="true"># </span>
        {t('notify.denied')}
      </p>
    );
  }

  const isBusy = status === 'subscribing';
  const isOn = status === 'subscribed';
  const isInstall = status === 'needs-install';

  const mark = isOn ? 'x' : isBusy ? '~' : isInstall ? '+' : ' ';
  const label = isBusy
    ? t('notify.enabling')
    : isOn
      ? t('notify.enabled')
      : isInstall
        ? t('notify.iosInstall')
        : t('notify.enable');

  const handleClick = () => {
    if (isBusy) return;
    if (isInstall) {
      setShowGuide(true);
      return;
    }
    if (isOn) {
      void disable();
      return;
    }
    void enable();
  };

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        aria-pressed={isOn}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.97] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:text-foreground disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:active:scale-100"
      >
        <span className="text-foreground">[{mark}]</span> {label}
        {isOn && (
          <span className="text-muted-foreground/60"> ({t('notify.disable')})</span>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-destructive">
          {t('notify.error')}
        </p>
      )}
      {isOn && canInstall && (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mt-1 block text-muted-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:text-foreground transition-colors"
        >
          <span className="text-foreground">[+]</span> {t('notify.addToHome')}
        </button>
      )}
      {showGuide && <IOSInstallGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

export default NotificationButton;
