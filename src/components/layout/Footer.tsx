import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { SHORTCUTS, COPYRIGHT, GITHUB_URL } from '@/constants/app';

function Footer() {
  const { t } = useTranslation('common');
  const nickname = useSessionStore((s) => s.nickname);
  const username = nickname || 'guest';

  return (
    <footer className="mt-8 py-2 border-t border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span>{username}@icantcode.today:~$ <span className="text-muted-foreground/50"># {COPYRIGHT}</span></span>
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap sm:gap-2">
            <span>[{SHORTCUTS.NEW.key}] {t('shortcutNew')}</span>
            <span>[{SHORTCUTS.THEME.key}] {t('shortcutTheme')}</span>
            <span>[{SHORTCUTS.LANG.key}] {t('shortcutLang')}</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('githubLink')}
              className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none active:translate-y-px transition-colors"
            >
              ↗ github
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
