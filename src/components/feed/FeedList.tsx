import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { usePostsQuery } from '@/apis/queries/usePosts';
import FeedItem from './FeedItem';
import Cursor from '@/components/ui/Cursor';

const listVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

function FeedList() {
  const { t } = useTranslation('feed');
  const { data: posts, isLoading, isError } = usePostsQuery();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)]">
        <p>Loading... <Cursor /></p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-[var(--color-error)]">
        <p>[ERR] Failed to load posts</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)]">
        <p>{t('empty')}</p>
        <p className="text-xs mt-1">{t('emptyDescription')}</p>
      </div>
    );
  }

  return (
    <motion.div variants={listVariants} initial="initial" animate="animate">
      {posts.map((post) => (
        <motion.div key={post.id} variants={itemVariants}>
          <FeedItem post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default FeedList;
