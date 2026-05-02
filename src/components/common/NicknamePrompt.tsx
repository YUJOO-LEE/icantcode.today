import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { MAX_NICKNAME_LENGTH } from '@/lib/constants';
import { generateRandomNickname } from '@/lib/nicknameGenerator';
import TerminalInput from '@/components/ui/TerminalInput';
import TerminalButton from '@/components/ui/TerminalButton';

interface NicknamePromptProps {
  onComplete: () => void;
  onCancel?: () => void;
  /**
   * Set while the parent's prompt-driven mutation is in flight. The prompt
   * stays mounted on screen for the entire mutation, so without this flag the
   * submit/cancel/reroll controls would still appear clickable and could
   * trigger a second nickname-set + onComplete cycle.
   */
  isSubmitting?: boolean;
}

function NicknamePrompt({ onComplete, onCancel, isSubmitting = false }: NicknamePromptProps) {
  const { t, i18n } = useTranslation('auth');
  const [value, setValue] = useState(() => generateRandomNickname(i18n.language));
  const setNickname = useSessionStore((s) => s.setNickname);
  const isSubmittedRef = useRef(false);

  const handleSubmit = () => {
    if (isSubmittedRef.current || isSubmitting) return;
    const trimmed = value.trim();
    const sanitized = trimmed.replace(/[\p{Cc}\p{Cf}]/gu, '');
    if (sanitized.length > 0 && sanitized.length <= MAX_NICKNAME_LENGTH) {
      isSubmittedRef.current = true;
      setNickname(sanitized);
      onComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (isSubmitting) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const submitDisabled = isSubmitting || value.trim().length === 0;

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
        aria-label={t('nicknamePlaceholder')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_NICKNAME_LENGTH}
        disabled={isSubmitting}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- inline nickname prompt is intentionally focused when it opens (CLI aesthetic)
        autoFocus
      />
      <div className="flex gap-2 mt-3 text-muted-foreground">
        <TerminalButton onClick={handleSubmit} disabled={submitDisabled}>
          {isSubmitting ? t('common:submitting') : t('common:submit')}
        </TerminalButton>
        <TerminalButton
          onClick={() => setValue(generateRandomNickname(i18n.language))}
          disabled={isSubmitting}
        >
          {t('reroll')}
        </TerminalButton>
        {onCancel && (
          <TerminalButton onClick={onCancel} disabled={isSubmitting}>
            {t('common:cancel')}
          </TerminalButton>
        )}
      </div>
    </div>
  );
}

export default NicknamePrompt;
