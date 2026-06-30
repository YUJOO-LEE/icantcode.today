import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import TerminalButton from '@/components/ui/TerminalButton';

interface IOSInstallGuideProps {
  onClose: () => void;
}

/**
 * iOS Safari has no programmatic "Add to Home Screen" — push only works once
 * the PWA is installed. This overlay walks the user through the manual steps.
 */
function IOSInstallGuide({ onClose }: IOSInstallGuideProps) {
  const { t } = useTranslation('status');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
