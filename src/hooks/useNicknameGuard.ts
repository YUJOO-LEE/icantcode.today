import { useState, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/stores/sessionStore';

export function useNicknameGuard() {
  const { nickname, userCode } = useSessionStore(
    useShallow((s) => ({ nickname: s.nickname, userCode: s.userCode })),
  );
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const guardAction = useCallback(
    (action: () => void) => {
      if (nickname === null) {
        pendingActionRef.current = action;
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

  const completeWithNickname = useCallback(() => {
    setShowNicknamePrompt(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const shouldRenderPrompt = showNicknamePrompt && nickname === null;

  return { nickname, userCode, guardAction, dismissPrompt, completeWithNickname, shouldRenderPrompt };
}
