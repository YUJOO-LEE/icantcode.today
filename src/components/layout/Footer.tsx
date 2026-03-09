import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="border-t border-[var(--color-border)] px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
      {t('copyright')}
    </footer>
  );
}

export default Footer;
