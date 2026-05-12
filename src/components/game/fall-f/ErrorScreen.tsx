import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TerminalButton from '@/components/ui/TerminalButton';

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

      <div className="mt-6 flex gap-2">
        <TerminalButton ref={retryRef} onClick={onRetry} className="text-primary">
          {t('actions.retry')}
        </TerminalButton>
        <TerminalButton onClick={onHome}>
          {t('actions.home')}
        </TerminalButton>
      </div>
    </section>
  );
}

export default ErrorScreen;
