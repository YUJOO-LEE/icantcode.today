import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreateComment } from '@/apis/queries/useComments';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import TerminalInput from '@/components/ui/TerminalInput';
import TerminalButton from '@/components/ui/TerminalButton';
import NicknamePrompt from '@/components/common/NicknamePrompt';

interface CommentFormProps {
  postId: number;
}

function CommentForm({ postId }: CommentFormProps) {
  const { t } = useTranslation('feed');
  const nickname = useSessionStore((s) => s.nickname);
  const userCode = useSessionStore((s) => s.userCode);
  const hasNickname = useSessionStore((s) => s.hasNickname);
  const [content, setContent] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const createComment = useCreateComment(postId);

  const handleSubmit = () => {
    if (!hasNickname()) {
      setShowNicknamePrompt(true);
      return;
    }
    if (content.trim().length === 0 || !nickname) return;

    createComment.mutate(
      { content: content.trim(), author: nickname, userCode },
      { onSuccess: () => setContent('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (showNicknamePrompt && !hasNickname()) {
    return (
      <NicknamePrompt
        onComplete={() => setShowNicknamePrompt(false)}
        onCancel={() => setShowNicknamePrompt(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1">
        <TerminalInput
          prompt=">"
          placeholder={t('commentPlaceholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_COMMENT_LENGTH}
          onFocus={() => {
            if (!hasNickname()) {
              setShowNicknamePrompt(true);
            }
          }}
        />
      </div>
      <TerminalButton
        onClick={handleSubmit}
        disabled={content.trim().length === 0 || createComment.isPending}
      >
        {t('commentSubmit')}
      </TerminalButton>
    </div>
  );
}

export default CommentForm;
