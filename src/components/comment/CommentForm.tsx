import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNicknameGuard } from '@/hooks/useNicknameGuard';
import { useCreateComment } from '@/apis/queries/useComments';
import { useSessionStore } from '@/stores/sessionStore';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import TerminalInput from '@/components/ui/TerminalInput';
import NicknamePrompt from '@/components/common/NicknamePrompt';

interface CommentFormProps {
  postId: number;
}

function CommentForm({ postId }: CommentFormProps) {
  const { t } = useTranslation('feed');
  const { userCode, guardAction, dismissPrompt, completeWithNickname, shouldRenderPrompt } = useNicknameGuard();
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const createComment = useCreateComment(postId);

  const handleSubmit = () => {
    if (createComment.isPending) return;
    setErrorMessage('');
    guardAction(() => {
      const currentNickname = useSessionStore.getState().nickname;
      if (content.trim().length === 0 || !currentNickname) return;

      createComment.mutate(
        { content: content.trim(), author: currentNickname, userCode },
        {
          onSuccess: () => setContent(''),
          onError: () => setErrorMessage(t('submitError')),
        },
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
        onComplete={completeWithNickname}
        onCancel={dismissPrompt}
      />
    );
  }

  return (
    <div className="mt-3">
      <TerminalInput
        prompt=">"
        placeholder={t('commentPlaceholder')}
        aria-label={t('commentPlaceholder')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_COMMENT_LENGTH}
        autoFocus
      />
      <p className="mt-1 text-[10px] text-muted-foreground/50 pl-4" aria-hidden="true">
        enter: submit | esc: cancel
      </p>
      {errorMessage && (
        <p role="alert" className="mt-1 text-[10px] text-destructive pl-4">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default CommentForm;
