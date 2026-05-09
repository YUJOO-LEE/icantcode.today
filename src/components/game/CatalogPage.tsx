import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTES } from '@/constants/routes';
import Cursor from '@/components/ui/Cursor';

function CatalogPage() {
  const { t } = useTranslation('game');

  return (
    <section className="font-mono text-xs">
      <p className="text-muted-foreground">$ {t('catalog.heading')}</p>
      <div className="mt-3 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">-rwxr-xr-x</span>
          <Link
            to={ROUTES.GAME_FALL_F}
            className="text-primary underline-offset-2 hover:underline focus-visible:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
          >
            fall-f
          </Link>
          <span className="text-muted-foreground">2026-05</span>
          <span>{t('catalog.subtitle')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
          <span>-rwxr-xr-x</span>
          <span>{t('catalog.moreComing')}</span>
        </div>
      </div>
      <p className="mt-4 text-muted-foreground">
        &gt; <Cursor />
      </p>
    </section>
  );
}

export default CatalogPage;
