import { useTranslation } from 'react-i18next';

function LoadingScreen() {
  const { t } = useTranslation('game');

  return (
    <section className="font-mono text-xs" role="status" aria-live="polite">
      <p className="text-muted-foreground">{t('loading.title')}</p>

      <div className="mt-3 ml-2 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">$</span>
        <span aria-label={t('loading.establishing')}>
          {t('loading.establishing')}
          <span className="fall-f-ellipsis" aria-hidden="true" />
        </span>

        <span className="text-muted-foreground">{t('labels.in')}</span>
        <span className="text-muted-foreground">{t('loading.frame')}</span>
      </div>
    </section>
  );
}

export default LoadingScreen;
