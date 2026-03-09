import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { SHORTCUTS, COPYRIGHT } from '@/constants/app';

function Footer() {
  const { t } = useTranslation('common');
  const nickname = useSessionStore((s) => s.nickname);
  const username = nickname || 'guest';

  return (
    <footer className="mt-8 pt-4 border-t border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{username}@icantcode.today:~$ <span className="text-muted-foreground/50"># {COPYRIGHT}</span></span>
          <div className="flex items-center gap-2">
            <span>[{SHORTCUTS.NEW.key}] {t('shortcutNew')}</span>
            <span>[{SHORTCUTS.THEME.key}] {t('shortcutTheme')}</span>
            <span>[{SHORTCUTS.LANG.key}] {t('shortcutLang')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
