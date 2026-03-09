import { formatRelativeTime } from '@/lib/utils';
import type { CommentResponse } from '@/types/api';

interface CommentItemProps {
  comment: CommentResponse;
}

function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="py-2 border-b border-[var(--color-border)] last:border-b-0">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
        <span className="text-[var(--color-primary)]">@{comment.author}</span>
        <span>·</span>
        <time title={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
      </div>
      <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
        {comment.content}
      </p>
    </div>
  );
}

export default CommentItem;
