import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

function ErrorScreen({ onRetry, onHome }: ErrorScreenProps) {
  const { t } = useTranslation('game');
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <section className="font-mono text-xs" role="alert" aria-live="assertive">
      <p className="text-destructive whitespace-pre-wrap">{t('error.titles.resize')}</p>

      <div className="mt-3 ml-2 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">{t('labels.error')}</span>
        <span>{t('error.resize')}</span>

        <span className="text-muted-foreground">{t('labels.in')}</span>
        <span className="text-muted-foreground">{t('error.frames.resize')}</span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          ref={retryRef}
          type="button"
          onClick={onRetry}
          className="text-primary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
        >
          {t('actions.retry')}
        </button>
        <button
          type="button"
          onClick={onHome}
          className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
        >
          {t('actions.home')}
        </button>
      </div>
    </section>
  );
}

export default ErrorScreen;
