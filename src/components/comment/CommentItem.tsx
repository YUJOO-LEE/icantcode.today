import { formatRelativeTime } from '@/lib/utils';
import type { CommentResponse } from '@/types/api';

interface CommentItemProps {
  comment: CommentResponse;
}

function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="border-l border-border/30 pl-4 py-1 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <span>└──</span>
        <span className="text-foreground">{comment.author}</span>
        <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
      </div>
      <pre className="whitespace-pre-wrap text-foreground/80 pl-6 leading-relaxed">
        {comment.content}
      </pre>
    </div>
  );
}

export default CommentItem;
