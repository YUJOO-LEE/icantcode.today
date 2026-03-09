import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';

function Footer() {
  const { t } = useTranslation('common');
  const nickname = useSessionStore((s) => s.nickname);
  const username = nickname || 'guest';

  return (
    <footer className="mt-8 pt-4 border-t border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{username}@icantcode.today:~$</span>
          <div className="flex items-center gap-2">
            <span>{t('shortcutNew')}</span>
            <span>{t('shortcutTheme')}</span>
            <span>{t('shortcutLang')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
