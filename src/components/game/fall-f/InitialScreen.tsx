import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { VERSION } from './constants';

interface InitialScreenProps {
  best: number;
  hasBest: boolean;
  onStart: () => void;
}

function InitialScreen({ best, hasBest, onStart }: InitialScreenProps) {
  const { t } = useTranslation('game');
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  return (
    <section className="font-mono text-xs">
      <p className="text-muted-foreground">$ fall -f</p>
      <p className="mt-2 text-muted-foreground">── fall -f v{VERSION} — follow the fall ──</p>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">{t('labels.keys')}</span>
        <span>{t('labels.move')}</span>

        <span className="text-muted-foreground">{t('labels.death')}</span>
        <div className="space-y-0">
          <p>
            <span className="text-destructive">[TIMEOUT]</span>{' '}
            <span>{t('death.timeout')}</span>
          </p>
          <p>
            <span className="text-destructive">[SEGFAULT]</span>{' '}
            <span>{t('death.segfault')}</span>
          </p>
        </div>

        {hasBest && (
          <>
            <span className="text-muted-foreground">{t('labels.best')}</span>
            <span className="text-primary">{best}</span>
          </>
        )}
      </div>

      <p className="mt-3">
        {isCoarsePointer ? (
          <button
            type="button"
            onClick={onStart}
            className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
          >
            $ {t('start.mobile')}
          </button>
        ) : (
          <span className="text-muted-foreground">$ {t('start.desktop')}</span>
        )}
      </p>
    </section>
  );
}

export default InitialScreen;
