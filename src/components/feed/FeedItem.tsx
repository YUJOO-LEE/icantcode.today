import { memo, useState } from 'react';
import TerminalCard from '@/components/ui/TerminalCard';
import TerminalPrompt from '@/components/ui/TerminalPrompt';
import CommentList from '@/components/comment/CommentList';
import type { PostSummaryResponse } from '@/types/api';

interface FeedItemProps {
  post: PostSummaryResponse;
}

const FeedItem = memo(function FeedItem({ post }: FeedItemProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="mb-3">
      <TerminalCard>
        <TerminalCard.Header>
          <TerminalPrompt
            user={post.author}
            path="~/feed"
            time={post.createdAt}
            symbol=">"
          />
        </TerminalCard.Header>
        <TerminalCard.Divider />
        <TerminalCard.Body>
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
            {post.content}
          </p>
        </TerminalCard.Body>
        <TerminalCard.Divider />
        <TerminalCard.Footer>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
          >
            💬 {post.commentCount}
          </button>
        </TerminalCard.Footer>
      </TerminalCard>
      {showComments && <CommentList postId={post.id} />}
    </div>
  );
});

export default FeedItem;
