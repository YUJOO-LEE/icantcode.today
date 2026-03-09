import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useStatusStore } from '@/stores/statusStore';
import { useThemeStore } from '@/stores/themeStore';
import { useStatusQuery } from '@/apis/queries/useStatus';
import LandingView from '@/components/status/LandingView';
import CheckingView from '@/components/status/CheckingView';
import StatusBanner from '@/components/status/StatusBanner';
import FeedComposer from '@/components/feed/FeedComposer';
import FeedList from '@/components/feed/FeedList';

function HomePage() {
  const { t } = useTranslation('common');
  const { i18n } = useTranslation();
  const apiStatus = useStatusStore((s) => s.apiStatus);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [showComposer, setShowComposer] = useState(false);
  useStatusQuery();

  useEffect(() => {
    const titles: Record<string, string> = {
      normal: 'icantcode.today',
      checking: '[...] icantcode.today',
      down: '[DOWN] icantcode.today',
      degraded: '[WARN] icantcode.today',
    };
    document.title = titles[apiStatus] || 'icantcode.today';
  }, [apiStatus]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputFocused) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setShowComposer((prev) => !prev);
          break;
        case 't':
          e.preventDefault();
          toggleTheme();
          break;
        case 'l':
          e.preventDefault();
          i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko');
          break;
        case 'escape':
          setShowComposer(false);
          break;
      }
    },
    [toggleTheme, i18n],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isFeedVisible = apiStatus === 'down' || apiStatus === 'degraded';

  return (
    <AnimatePresence mode="wait">
      {apiStatus === 'checking' && (
        <motion.div key="checking" className="flex-1 flex flex-col">
          <CheckingView />
        </motion.div>
      )}
      {apiStatus === 'normal' && (
        <motion.div key="landing" className="flex-1 flex flex-col">
          <LandingView />
        </motion.div>
      )}
      {isFeedVisible && (
        <motion.div
          key="feed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Welcome message */}
          <div className="mb-6 text-xs leading-relaxed">
            <div className="text-muted-foreground">
              <span className="text-foreground">$</span> cat /etc/motd
            </div>
            <div className="mt-2 pl-2 border-l-2 border-border text-muted-foreground">
              <p>{t('appName')} - {t('subtitle')}</p>
              <p className="mt-1">{t('help')}</p>
            </div>
          </div>

          <StatusBanner status={apiStatus} />
          <FeedComposer
            isOpen={showComposer}
            onToggle={() => setShowComposer((prev) => !prev)}
          />
          <FeedList />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HomePage;
