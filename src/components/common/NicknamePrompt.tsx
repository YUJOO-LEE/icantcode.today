import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { MAX_NICKNAME_LENGTH } from '@/lib/constants';
import TerminalInput from '@/components/ui/TerminalInput';
import TerminalButton from '@/components/ui/TerminalButton';

interface NicknamePromptProps {
  onComplete: () => void;
  onCancel?: () => void;
}

function NicknamePrompt({ onComplete, onCancel }: NicknamePromptProps) {
  const { t } = useTranslation('auth');
  const [value, setValue] = useState('');
  const setNickname = useSessionStore((s) => s.setNickname);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed.length <= MAX_NICKNAME_LENGTH) {
      setNickname(trimmed);
      onComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="border border-border p-4 text-xs">
      <p className="text-muted-foreground mb-2">
        <span className="text-foreground">$</span> set-nickname
      </p>
      <p className="text-muted-foreground/50 mb-3">
        # {t('nicknameRequired')}
      </p>
      <TerminalInput
        prompt=">"
        placeholder={t('nicknamePlaceholder')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_NICKNAME_LENGTH}
        autoFocus
      />
      <div className="flex gap-2 mt-3 text-muted-foreground">
        <TerminalButton
          onClick={handleSubmit}
          disabled={value.trim().length === 0}
        >
          {t('common:submit')}
        </TerminalButton>
        {onCancel && (
          <TerminalButton onClick={onCancel}>
            {t('common:cancel')}
          </TerminalButton>
        )}
      </div>
    </div>
  );
}

export default NicknamePrompt;
