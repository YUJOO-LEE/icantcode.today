import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';

export function useNicknameGuard() {
  const nickname = useSessionStore((s) => s.nickname);
  const userCode = useSessionStore((s) => s.userCode);
  const hasNickname = useSessionStore((s) => s.hasNickname);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);

  const guardAction = useCallback(
    (action: () => void) => {
      if (!hasNickname()) {
        setShowNicknamePrompt(true);
        return;
      }
      action();
    },
    [hasNickname],
  );

  const showPromptIfNeeded = useCallback(() => {
    if (!hasNickname()) {
      setShowNicknamePrompt(true);
    }
  }, [hasNickname]);

  const dismissPrompt = useCallback(() => {
    setShowNicknamePrompt(false);
  }, []);

  const shouldRenderPrompt = showNicknamePrompt && nickname === null;

  return { nickname, userCode, guardAction, showPromptIfNeeded, dismissPrompt, shouldRenderPrompt };
}
