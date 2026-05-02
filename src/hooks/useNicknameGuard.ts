import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Inline-prompt nickname guard.
 *
 * The hook intentionally does NOT capture caller closures (no pendingActionRef).
 * Instead it exposes pure flags + setters; the caller decides — via its own
 * state + useEffect — when to actually fire its mutation. This keeps the
 * submit pipeline race-free with the inline-prompt remount cycle.
 */
export function useNicknameGuard() {
  const { nickname, userCode } = useSessionStore(
    useShallow((s) => ({ nickname: s.nickname, userCode: s.userCode })),
  );
  const [isPromptVisible, setPromptVisible] = useState(false);

  const requestNickname = useCallback(() => {
    setPromptVisible(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setPromptVisible(false);
  }, []);

  return {
    nickname,
    userCode,
    isPromptVisible,
    requestNickname,
    dismissPrompt,
  };
}
