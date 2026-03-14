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
  const { data: comments, isLoading, isError } = useCommentsQuery(postId);

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">
          loading... <Cursor />
        </p>
      ) : isError ? (
        <p className="text-xs text-destructive">
          [ERR] {t('loadError')}
        </p>
      ) : comments && comments.length > 0 ? (
        comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))
      ) : (
        <p className="text-xs text-muted-foreground">{t('noComments')}</p>
      )}
      <CommentForm postId={postId} />
    </div>
  );
}

export default CommentList;
