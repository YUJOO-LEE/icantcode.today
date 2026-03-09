import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { usePostsQuery } from '@/apis/queries/usePosts';
import FeedItem from './FeedItem';

const listVariants = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

function FeedList() {
  const { t } = useTranslation('feed');
  const { data: posts, isLoading, isError } = usePostsQuery();

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        <span className="cursor">{t('common:loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-xs text-destructive">
        <p>[ERR] {t('loadError')}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4">
        <p>drwxr-xr-x  0 posts  (empty)</p>
        <p className="mt-2 text-muted-foreground/50">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div role="feed" aria-label={t('feedLabel')}>
      <div className="mb-4 text-xs text-muted-foreground">
        <span className="text-foreground">$</span> ls -la ./posts/
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {t('total', { count: posts.length })}
      </div>
      <motion.div variants={listVariants} initial="initial" animate="animate">
        {posts.map((post) => (
          <motion.div key={post.id} variants={itemVariants}>
            <FeedItem post={post} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default FeedList;
