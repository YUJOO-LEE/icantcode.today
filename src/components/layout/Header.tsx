import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { Link, useLocation } from 'react-router';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeStore } from '@/stores/themeStore';
import TerminalButton from '@/components/ui/TerminalButton';
import Logo from '@/components/ui/Logo';
import { ROUTES } from '@/constants/routes';

function Header() {
  const { t, i18n } = useTranslation('common');
  const { pathname } = useLocation();
  const nickname = useSessionStore((s) => s.nickname);
  const { theme, toggleTheme } = useThemeStore(
    useShallow((s) => ({ theme: s.theme, toggleTheme: s.toggleTheme })),
  );

  const nextLang = i18n.language === 'ko' ? 'en' : 'ko';

  const toggleLanguage = () => {
    i18n.changeLanguage(nextLang);
  };

  const username = nickname || 'guest';

  const inGameSubroute = pathname.startsWith(`${ROUTES.GAME}/`);
  const inGameRoute = pathname === ROUTES.GAME || inGameSubroute;
  const primaryNavTo = inGameSubroute
    ? ROUTES.GAME
    : inGameRoute
      ? ROUTES.HOME
      : ROUTES.GAME;
  const primaryNavKey = primaryNavTo === ROUTES.HOME ? 'siteNavHome' : 'siteNavGame';

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-2">
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.HOME}
            aria-label={t('siteNavHome')}
            className="flex items-center gap-1 text-xs text-muted-foreground sm:gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
          >
            <Logo size={16} />
            <span className="text-foreground">{username}@icantcode.today</span>
            <span>:</span>
            <span className="text-foreground">~</span>
            <span>$</span>
            <span className="cursor">_</span>
          </Link>

          <nav aria-label={t('siteNav')}>
            <div className="flex items-center gap-1 text-[10px] sm:gap-2">
              <Link
                to={primaryNavTo}
                className="text-[10px] text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:text-foreground"
              >
                [{t(primaryNavKey)}]
              </Link>
              <span aria-hidden="true" className="text-[10px] text-muted-foreground">│</span>
              <TerminalButton
                onClick={toggleLanguage}
                className="text-[10px]"
                aria-label={t('switchLang', { lang: i18n.language === 'ko' ? 'English' : '한국어' })}
              >
                {i18n.getFixedT(nextLang, 'common')('currentLang')}
              </TerminalButton>
              <TerminalButton
                onClick={toggleTheme}
                className="text-[10px]"
                aria-label={t('switchTheme', { theme: theme === 'dark' ? t('lightMode') : t('darkMode') })}
              >
                {theme === 'dark' ? t('lightMode') : t('darkMode')}
              </TerminalButton>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
