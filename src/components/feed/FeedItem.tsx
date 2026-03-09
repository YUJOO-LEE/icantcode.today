import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TerminalPrompt from '@/components/ui/TerminalPrompt';
import TerminalButton from '@/components/ui/TerminalButton';
import CommentList from '@/components/comment/CommentList';
import type { PostSummaryResponse } from '@/types/api';

interface FeedItemProps {
  post: PostSummaryResponse;
}

const FeedItem = memo(function FeedItem({ post }: FeedItemProps) {
  const { t } = useTranslation('feed');
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="py-3 border-b border-border/50 last:border-0 text-xs">
      <div className="mb-2">
        <TerminalPrompt user={post.author} time={post.createdAt} id={post.id} />
      </div>

      <div className="pl-4 border-l border-border/50 mb-2">
        <pre className="whitespace-pre-wrap text-foreground leading-relaxed text-xs">
          {post.content}
        </pre>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <TerminalButton
          onClick={() => setShowComments(!showComments)}
          aria-expanded={showComments}
          aria-label={t('toggleComments', { count: post.commentCount })}
        >
          {t('replies')}
        </TerminalButton>

        {post.commentCount > 0 && (
          <TerminalButton
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? t('hideComments') : t('showComments')} {post.commentCount}
          </TerminalButton>
        )}
      </div>

      {showComments && (
        <div className="mt-3 pl-4">
          <CommentList postId={post.id} />
        </div>
      )}
    </article>
  );
});

export default FeedItem;
