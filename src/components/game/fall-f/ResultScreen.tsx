import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export type DeathCause = 'segfault' | 'timeout';

interface ResultScreenProps {
  cause: DeathCause;
  score: number;
  best: number;
  onRetry: () => void;
  onHome: () => void;
}

const TITLES: Record<DeathCause, string> = {
  segfault: '[SEGFAULT] segmentation fault (core dumped)',
  timeout: '[TIMEOUT] killed: process pushed off the top (core dumped)',
};

const CAUSE_KEYS: Record<DeathCause, string> = {
  segfault: 'death.segfault',
  timeout: 'death.timeout',
};

function ResultScreen({ cause, score, best, onRetry, onHome }: ResultScreenProps) {
  const { t } = useTranslation('game');
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    retryRef.current?.focus();
  }, []);

  return (
    <section className="font-mono text-xs" role="alert" aria-live="assertive">
      <p className="text-destructive whitespace-pre-wrap">{TITLES[cause]}</p>

      <div className="mt-3 ml-2 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">{t('labels.death')}</span>
        <span>{t(CAUSE_KEYS[cause])}</span>

        <span className="text-muted-foreground">{t('labels.score')}</span>
        <span>{score}</span>

        <span className="text-muted-foreground">{t('labels.best')}</span>
        <span className="text-primary">{best}</span>

        <span className="text-muted-foreground">{t('labels.in')}</span>
        <span className="text-muted-foreground">fall_f::on_tick</span>
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

export default ResultScreen;
