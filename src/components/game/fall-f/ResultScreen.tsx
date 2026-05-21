import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
import { MAX_NICKNAME_LENGTH } from '@/lib/constants';
import { generateRandomNickname } from '@/lib/nicknameGenerator';
import { useSubmitScore } from '@/apis/queries/useGames';
import TerminalInput from '@/components/ui/TerminalInput';
import TerminalButton from '@/components/ui/TerminalButton';
import RankingBoard from './RankingBoard';

type DeathCause = 'segfault' | 'timeout' | 'killed';

interface ResultScreenProps {
  cause: DeathCause;
  score: number;
  best: number;
  sessionId: string | null;
  onRetry: () => void;
  onHome: () => void;
}

const TITLE_KEYS: Record<DeathCause, string> = {
  segfault: 'result.titles.segfault',
  timeout: 'result.titles.timeout',
  killed: 'result.titles.killed',
};

const CAUSE_KEYS: Record<DeathCause, string> = {
  segfault: 'death.segfault',
  timeout: 'death.timeout',
  killed: 'death.killed',
};

const FRAME_KEYS: Record<DeathCause, string> = {
  segfault: 'result.frame',
  timeout: 'result.frame',
  killed: 'result.frames.killed',
};

const SCORE_MAX = 99999;

function ResultScreen({ cause, score, best, sessionId, onRetry, onHome }: ResultScreenProps) {
  const { t, i18n } = useTranslation('game');
  const sessionNickname = useSessionStore((s) => s.nickname);
  const setNickname = useSessionStore((s) => s.setNickname);
  const retryRef = useRef<HTMLButtonElement>(null);

  const [value, setValue] = useState(
    () => sessionNickname ?? generateRandomNickname(i18n.language),
  );
  const [submittedNickname, setSubmittedNickname] = useState<string | null>(null);
  const submitMutation = useSubmitScore();

  // Score=0 means the player never landed on a platform — nothing meaningful to
  // submit, and the server doesn't need junk rows. Also blocks submit when
  // sessionId is missing (e.g. start API failed but somehow we landed here).
  const canSubmit = score > 0 && sessionId !== null;
  const isSubmitting = submitMutation.isPending;
  const isSubmitted = submittedNickname !== null;
  const showError = submitMutation.isError && !isSubmitted;

  useEffect(() => {
    if (isSubmitted) {
      retryRef.current?.focus();
    }
  }, [isSubmitted]);

  // Initial focus when the form is interactive: defer to the input via autoFocus.
  // For zero-score / submitted states we route focus to the retry button so
  // keyboard users land on the next meaningful action.
  useEffect(() => {
    if (!canSubmit && !isSubmitted) {
      retryRef.current?.focus();
    }
  }, [canSubmit, isSubmitted]);

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting || isSubmitted) return;
    if (sessionId === null) return;
    const trimmed = value.trim();
    const sanitized = trimmed.replace(/[\p{Cc}\p{Cf}]/gu, '');
    if (sanitized.length === 0 || sanitized.length > MAX_NICKNAME_LENGTH) return;

    submitMutation.mutate(
      { sessionId, nickname: sanitized, score: Math.min(score, SCORE_MAX) },
      {
        onSuccess: () => {
          setNickname(sanitized);
          setSubmittedNickname(sanitized);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const submitDisabled = !canSubmit || isSubmitting || isSubmitted || value.trim().length === 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <section
        className="font-mono text-xs sm:flex-[3] sm:min-w-0"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-destructive whitespace-pre-wrap">{t(TITLE_KEYS[cause])}</p>

      <div className="mt-3 ml-2 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-muted-foreground">{t('labels.death')}</span>
        <span>{t(CAUSE_KEYS[cause])}</span>

        <span className="text-muted-foreground">{t('labels.score')}</span>
        <span>{score}</span>

        <span className="text-muted-foreground">{t('labels.best')}</span>
        <span className="text-primary">{best}</span>

        <span className="text-muted-foreground">{t('labels.in')}</span>
        <span className="text-muted-foreground">{t(FRAME_KEYS[cause])}</span>
      </div>

      <div className="mt-4 text-xs">
        <p className="text-muted-foreground mb-2">── {t('result.submit.header')} ──</p>

        {isSubmitted ? (
          <p className="text-primary" role="status">
            {t('result.submit.ok', { nickname: submittedNickname })}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground mb-2">
              <span className="text-foreground">$</span> set-nickname
            </p>
            <p className="text-muted-foreground/50 mb-3">
              # {canSubmit ? t('result.submit.hint') : t('result.submit.zeroScore')}
            </p>
            {showError && (
              <p className="text-destructive mb-2" role="alert" aria-live="assertive">
                # {t('result.submit.error')}
              </p>
            )}
            <TerminalInput
              prompt=">"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_NICKNAME_LENGTH}
              disabled={!canSubmit || isSubmitting}
              aria-label={t('result.submit.hint')}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- inline submit form is intentionally focused on mount (CLI aesthetic, mirrors NicknamePrompt)
              autoFocus={canSubmit}
            />
            <div className="flex gap-2 mt-3">
              <TerminalButton
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="text-foreground"
              >
                {isSubmitting ? t('common:submitting') : t('common:submit')}
              </TerminalButton>
              <TerminalButton
                onClick={() => setValue(generateRandomNickname(i18n.language))}
                disabled={!canSubmit || isSubmitting}
              >
                {t('auth:reroll')}
              </TerminalButton>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <TerminalButton
          ref={retryRef}
          onClick={onRetry}
          className="text-primary"
        >
          {t('actions.retry')}
        </TerminalButton>
        <TerminalButton onClick={onHome}>
          {t('actions.home')}
        </TerminalButton>
      </div>
      </section>

      <RankingBoard className="sm:flex-[2] sm:min-w-0" />
    </div>
  );
}

export default ResultScreen;
