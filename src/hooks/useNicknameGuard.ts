import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/stores/sessionStore';

export function useNicknameGuard() {
  const { nickname, userCode } = useSessionStore(
    useShallow((s) => ({ nickname: s.nickname, userCode: s.userCode })),
  );
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);

  const guardAction = useCallback(
    (action: () => void) => {
      if (nickname === null) {
        setShowNicknamePrompt(true);
        return;
      }
      action();
    },
    [nickname],
  );

  const dismissPrompt = useCallback(() => {
    setShowNicknamePrompt(false);
  }, []);

  const shouldRenderPrompt = showNicknamePrompt && nickname === null;

  return { nickname, userCode, guardAction, dismissPrompt, shouldRenderPrompt };
}
