import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreatePost } from '@/apis/queries/usePosts';
import { MAX_POST_LENGTH } from '@/lib/constants';
import TerminalCard from '@/components/ui/TerminalCard';
import TerminalButton from '@/components/ui/TerminalButton';
import NicknamePrompt from '@/components/common/NicknamePrompt';

function FeedComposer() {
  const { t } = useTranslation('feed');
  const { t: tAuth } = useTranslation('auth');
  const nickname = useSessionStore((s) => s.nickname);
  const userCode = useSessionStore((s) => s.userCode);
  const hasNickname = useSessionStore((s) => s.hasNickname);
  const [content, setContent] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const createPost = useCreatePost();

  const handleSubmit = () => {
    if (!hasNickname()) {
      setShowNicknamePrompt(true);
      return;
    }
    if (content.trim().length === 0 || !nickname) return;

    createPost.mutate(
      { content: content.trim(), author: nickname, userCode },
      { onSuccess: () => setContent('') },
    );
  };

  if (showNicknamePrompt && !hasNickname()) {
    return (
      <div className="mb-4">
        <NicknamePrompt
          onComplete={() => setShowNicknamePrompt(false)}
          onCancel={() => setShowNicknamePrompt(false)}
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <TerminalCard>
        <TerminalCard.Header>
          {nickname ? `$ @${nickname} ~/compose` : `$ ${tAuth('anonymous')} ~/compose`}
        </TerminalCard.Header>
        <TerminalCard.Divider />
        <TerminalCard.Body>
          <textarea
            className="w-full bg-transparent text-[var(--color-text-primary)] outline-none resize-none font-[inherit] text-sm leading-relaxed"
            rows={3}
            placeholder={`> ${t('placeholder')}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_POST_LENGTH}
            onFocus={() => {
              if (!hasNickname()) {
                setShowNicknamePrompt(true);
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              {t('charCount', { current: content.length, max: MAX_POST_LENGTH })}
            </span>
            <TerminalButton
              onClick={handleSubmit}
              disabled={content.trim().length === 0 || createPost.isPending}
            >
              {createPost.isPending ? 'posting...' : t('post')}
            </TerminalButton>
          </div>
        </TerminalCard.Body>
      </TerminalCard>
    </div>
  );
}

export default FeedComposer;
