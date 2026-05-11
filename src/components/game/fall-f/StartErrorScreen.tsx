import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface StartErrorScreenProps {
  onRetry: () => void;
  onHome: () => void;
}

function StartErrorScreen({ onRetry, onHome }: StartErrorScreenProps) {
  const { t } = useTranslation('game');
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <section className="font-mono text-xs" role="alert" aria-live="assertive">
      <p className="text-destructive whitespace-pre-wrap">{t('error.titles.startFail')}</p>

      <div className="mt-3 ml-2 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">{t('labels.error')}</span>
        <span>{t('error.startFail')}</span>

        <span className="text-muted-foreground">{t('labels.in')}</span>
        <span className="text-muted-foreground">{t('error.frames.startFail')}</span>
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

export default StartErrorScreen;
