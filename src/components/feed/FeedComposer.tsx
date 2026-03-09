import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreatePost } from '@/apis/queries/usePosts';
import { MAX_POST_LENGTH } from '@/lib/constants';
import NicknamePrompt from '@/components/common/NicknamePrompt';

interface FeedComposerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

function FeedComposer({ isOpen = false, onToggle }: FeedComposerProps) {
  const { t } = useTranslation('feed');
  const nickname = useSessionStore((s) => s.nickname);
  const userCode = useSessionStore((s) => s.userCode);
  const hasNickname = useSessionStore((s) => s.hasNickname);
  const [content, setContent] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const createPost = useCreatePost();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!hasNickname()) {
      setShowNicknamePrompt(true);
      return;
    }
    if (content.trim().length === 0 || !nickname) return;

    createPost.mutate(
      { content: content.trim(), author: nickname, userCode },
      {
        onSuccess: () => {
          setContent('');
          onToggle?.();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onToggle?.();
    }
  };

  if (showNicknamePrompt && !hasNickname()) {
    return (
      <div className="mb-6">
        <NicknamePrompt
          onComplete={() => setShowNicknamePrompt(false)}
          onCancel={() => setShowNicknamePrompt(false)}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="text-xs text-left w-full group focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-foreground">$</span>
        <span className="text-muted-foreground group-hover:text-foreground transition-colors ml-1">
          {isOpen ? t('writing') : t('newPost')}
        </span>
        {!isOpen && <span className="cursor ml-1 text-muted-foreground">_</span>}
      </button>

      {isOpen && (
        <div className="mt-3">
          <div className="border border-border bg-card p-4">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground select-none pt-0.5 text-xs">&gt;</span>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                className="flex-1 min-h-[80px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
                aria-label={t('placeholder')}
                maxLength={MAX_POST_LENGTH}
                disabled={createPost.isPending}
                onFocus={() => {
                  if (!hasNickname()) {
                    setShowNicknamePrompt(true);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{t('submitHint')}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="hover:text-foreground transition-colors focus:outline-none"
              >
                [{t('common:cancel')}]
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={content.trim().length === 0 || createPost.isPending}
                className="text-foreground hover:underline focus:outline-none disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed"
              >
                [{createPost.isPending ? t('sending') : t('common:submit')}]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedComposer;
