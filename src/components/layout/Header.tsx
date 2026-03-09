import { useTranslation } from 'react-i18next';
import StatusIndicator from '@/components/status/StatusIndicator';
import { useStatusStore } from '@/stores/statusStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeStore } from '@/stores/themeStore';

function Header() {
  const { t } = useTranslation('common');
  const apiStatus = useStatusStore((s) => s.apiStatus);
  const nickname = useSessionStore((s) => s.nickname);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);

  return (
    <header className="border-b border-[var(--color-border)] px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[var(--color-primary)]">
            {t('appName')}
          </h1>
          <StatusIndicator status={apiStatus} showLabel={false} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            {nickname ? (
              <span>$ @{nickname} <span className="text-[var(--color-text-muted)]">[session]</span></span>
            ) : (
              <span>$ anonymous</span>
            )}
          </span>
          <button
            onClick={toggleTheme}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
