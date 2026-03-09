import { useTranslation } from 'react-i18next';
import { useCommentsQuery } from '@/apis/queries/useComments';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Cursor from '@/components/ui/Cursor';

interface CommentListProps {
  postId: number;
}

function CommentList({ postId }: CommentListProps) {
  const { t } = useTranslation('feed');
  const { data: comments, isLoading } = useCommentsQuery(postId);

  return (
    <div className="ml-4 mt-1 border-l-2 border-[var(--color-border)] pl-4 pb-2">
      {isLoading ? (
        <p className="text-xs text-[var(--color-text-muted)] py-2">
          Loading... <Cursor />
        </p>
      ) : comments && comments.length > 0 ? (
        comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))
      ) : (
        <p className="text-xs text-[var(--color-text-muted)] py-2">{t('noComments')}</p>
      )}
      <CommentForm postId={postId} />
    </div>
  );
}

export default CommentList;
