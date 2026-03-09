import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeStore } from '@/stores/themeStore';

function Header() {
  const { t, i18n } = useTranslation('common');
  const nickname = useSessionStore((s) => s.nickname);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);

  const toggleLanguage = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(next);
  };

  const username = nickname || 'guest';

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-foreground">{username}@icantcode.today</span>
            <span>:</span>
            <span className="text-foreground">~</span>
            <span>$</span>
            <span className="cursor">_</span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={t('switchLang', { lang: i18n.language === 'ko' ? 'English' : '한국어' })}
            >
              [{t('currentLang')}]
            </button>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={t('switchTheme', { theme: theme === 'dark' ? t('lightMode') : t('darkMode') })}
            >
              [{theme === 'dark' ? t('lightMode') : t('darkMode')}]
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
