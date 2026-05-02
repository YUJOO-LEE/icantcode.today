import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/stores/sessionStore';
import { usePromptedSubmit } from '@/hooks/usePromptedSubmit';
import { useCreatePost } from '@/apis/queries/usePosts';
import { MAX_POST_LENGTH } from '@/lib/constants';
import NicknamePrompt from '@/components/common/NicknamePrompt';
import TerminalButton from '@/components/ui/TerminalButton';
import type { CreatePostRequest } from '@/types/api';

interface FeedComposerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

function FeedComposer({ isOpen = false, onToggle }: FeedComposerProps) {
  const { t } = useTranslation('feed');
  const userCode = useSessionStore(useShallow((s) => s.userCode));
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isPromptVisible, trySubmit, handlePromptComplete, handlePromptCancel } =
    usePromptedSubmit<CreatePostRequest>({
      isPending: createPost.isPending,
      mutate: createPost.mutate,
      buildVars: (authorName, body) => ({ content: body, author: authorName, userCode }),
      onBeforeDispatch: () => setErrorMessage(''),
      onSuccess: () => {
        setContent('');
        onToggle?.();
      },
      onError: () => setErrorMessage(t('submitError')),
    });

  useEffect(() => {
    if (isOpen && !isPromptVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
    // Only refocus when the composer first opens. Refocusing on prompt
    // dismissal would re-introduce the autoFocus key-event race.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      trySubmit(content);
    }
    if (e.key === 'Escape') {
      onToggle?.();
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className={`text-sm text-left w-full group focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 transition-colors py-3 ${isOpen ? '' : 'border-b border-border hover:border-primary dark:hover:shadow-[0_0_30px_rgba(171,201,91,0.06)]'}`}
        aria-expanded={isOpen}
      >
        <span className="text-primary">$</span>
        <span className="text-foreground group-hover:text-primary transition-colors ml-1">
          {isOpen ? '# writing new post...' : './post --new'}
        </span>
        {!isOpen && <span className="cursor ml-1 text-primary">_</span>}
      </button>

      {isOpen && isPromptVisible && (
        <NicknamePrompt
          onComplete={handlePromptComplete}
          onCancel={handlePromptCancel}
          isSubmitting={createPost.isPending}
        />
      )}

      {isOpen && (
        // Textarea stays mounted while the prompt is up — only its visibility
        // flips. This keeps key events away from a freshly-remounted textarea
        // after the prompt closes.
        <div hidden={isPromptVisible}>
          <div className="border border-border bg-card p-4">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground select-none pt-0.5 text-xs">&gt;</span>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                className="flex-1 min-h-20 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
                aria-label={t('placeholder')}
                maxLength={MAX_POST_LENGTH}
                disabled={createPost.isPending}
              />
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-2 text-[10px] text-destructive">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span aria-hidden="true">ctrl+enter: submit | esc: cancel</span>
            <div className="flex gap-2">
              <TerminalButton type="button" onClick={onToggle}>
                {t('common:cancel')}
              </TerminalButton>
              <TerminalButton
                type="button"
                onClick={() => trySubmit(content)}
                disabled={content.trim().length === 0 || createPost.isPending}
                className="text-foreground"
              >
                {createPost.isPending ? t('common:submitting') : t('common:submit')}
              </TerminalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedComposer;
