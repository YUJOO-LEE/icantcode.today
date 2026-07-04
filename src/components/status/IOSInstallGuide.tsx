import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import TerminalButton from '@/components/ui/TerminalButton';
import { isIOSNonSafari } from '@/lib/push';

interface IOSInstallGuideProps {
  onClose: () => void;
}

/**
 * Push on iOS only works from a home-screen PWA, and only Safari can create
 * one. This overlay adapts to the current browser:
 * - Safari: walk through the "Share → Add to Home Screen" steps.
 * - Any other iOS browser (Chrome/Firefox/Edge): it can't install a
 *   push-capable app, so first route the user to Safari. iOS forbids a page
 *   from launching another browser, so we offer a copy-URL button plus a hint.
 */
function IOSInstallGuide({ onClose }: IOSInstallGuideProps) {
  const { t } = useTranslation('status');
  const closeRef = useRef<HTMLButtonElement>(null);
  const nonSafari = isIOSNonSafari();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard may be blocked (no permission / insecure context); the menu
      // hint still tells the user how to reach Safari manually.
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Click-outside-to-close backdrop, as a real button for keyboard a11y. */}
      <button
        type="button"
        aria-label={t('notify.iosGuide.close')}
        onClick={onClose}
        className="absolute inset-0 bg-background/80"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-guide-title"
        className="relative w-full max-w-sm border border-border bg-card p-4 text-xs"
      >
        {nonSafari ? (
          <>
            <p id="ios-guide-title" className="text-foreground">
              {t('notify.iosGuide.nonSafari.title')}
            </p>
            <p className="mt-3 text-muted-foreground">
              {t('notify.iosGuide.nonSafari.body')}
            </p>
            <div className="mt-4">
              <TerminalButton onClick={() => void handleCopy()}>
                {t('notify.iosGuide.nonSafari.copyUrl')}
              </TerminalButton>
              {copied && (
                <p role="status" className="mt-2 text-primary">
                  <span aria-hidden="true">✓ </span>
                  {t('notify.iosGuide.nonSafari.copied')}
                </p>
              )}
            </div>
            <p className="mt-3 text-muted-foreground/60">
              <span aria-hidden="true"># </span>
              {t('notify.iosGuide.nonSafari.menuHint')}
            </p>
          </>
        ) : (
          <>
            <p id="ios-guide-title" className="text-foreground">
              {t('notify.iosGuide.title')}
            </p>
            <ol className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <span className="text-primary">1.</span> {t('notify.iosGuide.step1')}
              </li>
              <li>
                <span className="text-primary">2.</span> {t('notify.iosGuide.step2')}
              </li>
              <li>
                <span className="text-primary">3.</span> {t('notify.iosGuide.step3')}
              </li>
            </ol>
            <p className="mt-3 text-muted-foreground/60">
              <span aria-hidden="true"># </span>
              {t('notify.iosGuide.safariNote')}
            </p>
          </>
        )}
        <div className="mt-4 text-right">
          <TerminalButton ref={closeRef} onClick={onClose}>
            {t('notify.iosGuide.close')}
          </TerminalButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default IOSInstallGuide;
