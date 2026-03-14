import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNicknameGuard } from '@/hooks/useNicknameGuard';
import { useCreateComment } from '@/apis/queries/useComments';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import TerminalInput from '@/components/ui/TerminalInput';
import NicknamePrompt from '@/components/common/NicknamePrompt';

interface CommentFormProps {
  postId: number;
}

function CommentForm({ postId }: CommentFormProps) {
  const { t } = useTranslation('feed');
  const { nickname, userCode, guardAction, showPromptIfNeeded, dismissPrompt, shouldRenderPrompt } = useNicknameGuard();
  const [content, setContent] = useState('');
  const createComment = useCreateComment(postId);

  const handleSubmit = () => {
    if (createComment.isPending) return;
    guardAction(() => {
      if (content.trim().length === 0 || !nickname) return;

      createComment.mutate(
        { content: content.trim(), author: nickname, userCode },
        { onSuccess: () => setContent(''), onError: () => alert(t('submitError')) },
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setContent('');
    }
  };

  if (shouldRenderPrompt) {
    return (
      <NicknamePrompt
        onComplete={dismissPrompt}
        onCancel={dismissPrompt}
      />
    );
  }

  return (
    <div className="mt-3">
      <TerminalInput
        prompt=">"
        placeholder={t('commentPlaceholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_COMMENT_LENGTH}
        onFocus={showPromptIfNeeded}
      />
      <p className="mt-1 text-[10px] text-muted-foreground/50 pl-4">
        enter: submit | esc: cancel
      </p>
    </div>
  );
}

export default CommentForm;
