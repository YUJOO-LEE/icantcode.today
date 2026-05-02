import { useCallback, useRef } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useNicknameGuard } from './useNicknameGuard';

interface PromptedSubmitConfig<TVars> {
  /** Mirror of the `useMutation().isPending` flag. */
  isPending: boolean;
  /** Mirror of `useMutation().mutate`. Receives variables + per-call callbacks. */
  mutate: (
    data: TVars,
    options: {
      onSuccess: () => void;
      onError: () => void;
    },
  ) => void;
  /** Build mutation variables from the resolved nickname + trimmed body. */
  buildVars: (authorName: string, body: string) => TVars;
  /** Caller-side reaction to a settled-success (clear input, close composer, …). */
  onSuccess?: () => void;
  /** Caller-side reaction to a settled-failure (surface an error, …). */
  onError?: () => void;
  /** Runs once at the start of every dispatch; e.g. clear stale error state. */
  onBeforeDispatch?: () => void;
}

interface PromptedSubmit {
  isPromptVisible: boolean;
  /** Pass the raw, untrimmed input value. */
  trySubmit: (rawBody: string) => void;
  /** Bind to NicknamePrompt's `onComplete`. */
  handlePromptComplete: () => void;
  /** Bind to NicknamePrompt's `onCancel`. */
  handlePromptCancel: () => void;
}

/**
 * Coordinates a "submit, capture nickname inline if missing, then mutate" flow.
 *
 * Lifecycle invariants:
 * - The pending body is held in a ref (no closure capture of stale form state).
 * - The inline NicknamePrompt stays visible for the entire in-flight mutation;
 *   it is dismissed exactly once — when the mutation actually settles.
 * - Caller-side `onSuccess` / `onError` fire after `dismissPrompt`, so the
 *   composer only ever transitions through one render between "prompt up" and
 *   "settled UI" (no flicker through the editable form view in between).
 */
export function usePromptedSubmit<TVars>(
  config: PromptedSubmitConfig<TVars>,
): PromptedSubmit {
  const { isPending, mutate, buildVars, onSuccess, onError, onBeforeDispatch } = config;
  const { nickname, isPromptVisible, requestNickname, dismissPrompt } = useNicknameGuard();
  const pendingBodyRef = useRef<string | null>(null);

  const dispatch = useCallback(
    (authorName: string, body: string) => {
      onBeforeDispatch?.();
      mutate(buildVars(authorName, body), {
        onSuccess: () => {
          dismissPrompt();
          onSuccess?.();
        },
        onError: () => {
          dismissPrompt();
          onError?.();
        },
      });
    },
    [mutate, buildVars, onSuccess, onError, onBeforeDispatch, dismissPrompt],
  );

  const trySubmit = useCallback(
    (rawBody: string) => {
      if (isPending || pendingBodyRef.current !== null) return;
      const trimmed = rawBody.trim();
      if (!trimmed) return;
      if (nickname) {
        dispatch(nickname, trimmed);
        return;
      }
      pendingBodyRef.current = trimmed;
      requestNickname();
    },
    [isPending, nickname, dispatch, requestNickname],
  );

  const handlePromptComplete = useCallback(() => {
    const body = pendingBodyRef.current;
    pendingBodyRef.current = null;
    // Read fresh from the store: NicknamePrompt has just called setNickname
    // synchronously, but our component may not yet have re-rendered with the
    // new value.
    const currentNickname = useSessionStore.getState().nickname;
    if (body && currentNickname) {
      dispatch(currentNickname, body);
      return;
    }
    dismissPrompt();
  }, [dispatch, dismissPrompt]);

  const handlePromptCancel = useCallback(() => {
    pendingBodyRef.current = null;
    dismissPrompt();
  }, [dismissPrompt]);

  return {
    isPromptVisible,
    trySubmit,
    handlePromptComplete,
    handlePromptCancel,
  };
}
