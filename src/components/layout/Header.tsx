import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeStore } from '@/stores/themeStore';
import TerminalButton from '@/components/ui/TerminalButton';
import Logo from '@/components/ui/Logo';

function Header() {
  const { t, i18n } = useTranslation('common');
  const nickname = useSessionStore((s) => s.nickname);
  const { theme, toggleTheme } = useThemeStore(
    useShallow((s) => ({ theme: s.theme, toggleTheme: s.toggleTheme })),
  );

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
            <Logo size={16} />
            <span className="text-foreground">{username}@icantcode.today</span>
            <span>:</span>
            <span className="text-foreground">~</span>
            <span>$</span>
            <span className="cursor">_</span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <TerminalButton
              onClick={toggleLanguage}
              className="text-[10px]"
              aria-label={t('switchLang', { lang: i18n.language === 'ko' ? 'English' : '한국어' })}
            >
              {t('currentLang')}
            </TerminalButton>
            <TerminalButton
              onClick={toggleTheme}
              className="text-[10px]"
              aria-label={t('switchTheme', { theme: theme === 'dark' ? t('lightMode') : t('darkMode') })}
            >
              {theme === 'dark' ? t('lightMode') : t('darkMode')}
            </TerminalButton>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
