import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNicknameGuard } from '@/hooks/useNicknameGuard';
import { useCreatePost } from '@/apis/queries/usePosts';
import { MAX_POST_LENGTH } from '@/lib/constants';
import NicknamePrompt from '@/components/common/NicknamePrompt';
import TerminalButton from '@/components/ui/TerminalButton';

interface FeedComposerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

function FeedComposer({ isOpen = false, onToggle }: FeedComposerProps) {
  const { t } = useTranslation('feed');
  const { nickname, userCode, guardAction, dismissPrompt, shouldRenderPrompt } = useNicknameGuard();
  const [content, setContent] = useState('');
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (createPost.isPending) return;
    guardAction(() => {
      if (content.trim().length === 0 || !nickname) return;

      createPost.mutate(
        { content: content.trim(), author: nickname, userCode },
        {
          onSuccess: () => {
            setContent('');
            onToggle?.();
          },
          onError: () => alert(t('submitError')),
        },
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onToggle?.();
    }
  };

  if (shouldRenderPrompt) {
    return (
      <div className="mb-6">
        <NicknamePrompt
          onComplete={dismissPrompt}
          onCancel={dismissPrompt}
        />
      </div>
    );
  }

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

      {isOpen && (
        <div>
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

          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>ctrl+enter: submit | esc: cancel</span>
            <div className="flex gap-2">
              <TerminalButton
                type="button"
                onClick={onToggle}
              >
                {t('common:cancel')}
              </TerminalButton>
              <TerminalButton
                type="button"
                onClick={handleSubmit}
                disabled={content.trim().length === 0 || createPost.isPending}
                className="text-foreground"
              >
                {createPost.isPending ? t('sending') : t('common:submit')}
              </TerminalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedComposer;
