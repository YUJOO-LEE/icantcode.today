import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { MAX_NICKNAME_LENGTH } from '@/lib/constants';
import TerminalCard from '@/components/ui/TerminalCard';
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
    <TerminalCard>
      <TerminalCard.Header>$ set-nickname</TerminalCard.Header>
      <TerminalCard.Divider />
      <TerminalCard.Body className="space-y-3">
        <p className="text-[var(--color-text-muted)] text-sm">
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
        <div className="flex gap-2">
          <TerminalButton onClick={handleSubmit} disabled={value.trim().length === 0}>
            {t('confirm', { ns: 'common' })}
          </TerminalButton>
          {onCancel && (
            <TerminalButton variant="ghost" onClick={onCancel}>
              {t('cancel', { ns: 'common' })}
            </TerminalButton>
          )}
        </div>
      </TerminalCard.Body>
    </TerminalCard>
  );
}

export default NicknamePrompt;
