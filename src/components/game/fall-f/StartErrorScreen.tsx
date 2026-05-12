import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TerminalButton from '@/components/ui/TerminalButton';

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

export default StartErrorScreen;
