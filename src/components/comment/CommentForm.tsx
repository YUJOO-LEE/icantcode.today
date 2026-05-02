import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useShallow } from 'zustand/react/shallow';
import { usePromptedSubmit } from '@/hooks/usePromptedSubmit';
import { useCreateComment } from '@/apis/queries/useComments';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import TerminalInput from '@/components/ui/TerminalInput';
import NicknamePrompt from '@/components/common/NicknamePrompt';
import type { CreateCommentRequest } from '@/types/api';

interface CommentFormProps {
  postId: number;
}

function CommentForm({ postId }: CommentFormProps) {
  const { t } = useTranslation('feed');
  const userCode = useSessionStore(useShallow((s) => s.userCode));
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const createComment = useCreateComment(postId);

  const { isPromptVisible, trySubmit, handlePromptComplete, handlePromptCancel } =
    usePromptedSubmit<CreateCommentRequest>({
      isPending: createComment.isPending,
      mutate: createComment.mutate,
      buildVars: (authorName, body) => ({ content: body, author: authorName, userCode }),
      onBeforeDispatch: () => setErrorMessage(''),
      onSuccess: () => setContent(''),
      onError: () => setErrorMessage(t('submitError')),
    });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      trySubmit(content);
    }
    if (e.key === 'Escape') {
      setContent('');
    }
  };

  return (
    <div className="mt-3">
      {isPromptVisible && (
        <NicknamePrompt
          onComplete={handlePromptComplete}
          onCancel={handlePromptCancel}
          isSubmitting={createComment.isPending}
        />
      )}
      {/* Form stays mounted so its input never re-fires autoFocus when the
          prompt closes — that remount is what previously hijacked key events
          for a phantom second submission. */}
      <div hidden={isPromptVisible}>
        <TerminalInput
          prompt=">"
          placeholder={t('commentPlaceholder')}
          aria-label={t('commentPlaceholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_COMMENT_LENGTH}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- inline comment form is intentionally focused when opened (CLI aesthetic)
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
    </div>
  );
}

export default CommentForm;
