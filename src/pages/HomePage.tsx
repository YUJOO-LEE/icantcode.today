import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStatusStore } from '@/stores/statusStore';
import { useStatusQuery } from '@/apis/queries/useStatus';
import LandingView from '@/components/status/LandingView';
import CheckingView from '@/components/status/CheckingView';
import StatusBanner from '@/components/status/StatusBanner';
import FeedComposer from '@/components/feed/FeedComposer';
import FeedList from '@/components/feed/FeedList';

function HomePage() {
  const apiStatus = useStatusStore((s) => s.apiStatus);
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

  return (
    <AnimatePresence mode="wait">
      {apiStatus === 'checking' && (
        <motion.div key="checking">
          <CheckingView />
        </motion.div>
      )}
      {apiStatus === 'normal' && (
        <motion.div key="landing">
          <LandingView />
        </motion.div>
      )}
      {(apiStatus === 'down' || apiStatus === 'degraded') && (
        <motion.div
          key="feed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <StatusBanner status={apiStatus} />
          <FeedComposer />
          <FeedList />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HomePage;
