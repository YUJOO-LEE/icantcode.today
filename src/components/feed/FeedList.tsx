import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useInfinitePostsQuery, usePostsPolling } from '@/apis/queries/usePosts';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import FeedItem from './FeedItem';
import Logo from '@/components/ui/Logo';

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
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePostsQuery();

  usePostsPolling(!!data);

  const sentinelRef = useIntersectionObserver(
    fetchNextPage,
    { enabled: hasNextPage && !isFetchingNextPage },
  );

  const posts = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.list) ?? [];
    const seen = new Set<number>();
    return all.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data?.pages]);

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground" role="status" aria-label={t('loadingPosts')}>
        <span className="cursor">{t('common:loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-xs text-destructive" role="alert">
        <p>[ERR] {t('loadError')}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative text-xs text-muted-foreground py-4">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Logo size={64} className="opacity-[0.04]" />
        </div>
        <div className="relative">
          <p>$ cat /dev/null</p>
          <p className="mt-2 text-muted-foreground/50">{t('empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div role="feed" aria-label={t('feedLabel')} aria-busy={isLoading}>
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

      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="text-xs text-muted-foreground py-2" role="status">
          <span className="cursor">{t('common:loading')}</span>
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="text-xs text-muted-foreground/50 py-2 text-center">
          {t('eof')}
        </div>
      )}
    </div>
  );
}

export default FeedList;
