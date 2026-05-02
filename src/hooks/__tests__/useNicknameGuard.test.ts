import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useNicknameGuard } from '../useNicknameGuard';
import { useSessionStore } from '@/stores/sessionStore';

describe('useNicknameGuard', () => {
  beforeEach(() => {
    useSessionStore.setState({
      nickname: null,
      userCode: 'test-uuid',
      setNickname: (nickname: string) =>
        useSessionStore.setState({ nickname }),
      hasNickname: () => useSessionStore.getState().nickname !== null,
    });
  });

  it('returns nickname and userCode from the session store', () => {
    const { result } = renderHook(() => useNicknameGuard());
    expect(result.current.nickname).toBeNull();
    expect(result.current.userCode).toBe('test-uuid');
  });

  it('isPromptVisible starts false', () => {
    const { result } = renderHook(() => useNicknameGuard());
    expect(result.current.isPromptVisible).toBe(false);
  });

  it('requestNickname flips isPromptVisible to true', () => {
    const { result } = renderHook(() => useNicknameGuard());
    act(() => {
      result.current.requestNickname();
    });
    expect(result.current.isPromptVisible).toBe(true);
  });

  it('dismissPrompt flips isPromptVisible back to false', () => {
    const { result } = renderHook(() => useNicknameGuard());
    act(() => {
      result.current.requestNickname();
    });
    expect(result.current.isPromptVisible).toBe(true);
    act(() => {
      result.current.dismissPrompt();
    });
    expect(result.current.isPromptVisible).toBe(false);
  });

  it('does not auto-hide the prompt when nickname becomes available — caller decides', () => {
    // Visibility is decoupled from nickname state by design: the consumer
    // (CommentForm / FeedComposer) is responsible for dismissing the prompt
    // inside its own pendingBody effect after firing the mutation.
    const { result } = renderHook(() => useNicknameGuard());
    act(() => {
      result.current.requestNickname();
    });
    act(() => {
      useSessionStore.setState({ nickname: 'tester' });
    });
    expect(result.current.isPromptVisible).toBe(true);
    expect(result.current.nickname).toBe('tester');
  });

  it('does not capture caller closures (no pending-action API)', () => {
    const { result } = renderHook(() => useNicknameGuard());
    // Surface contract: state-driven, no closure-based action queue.
    expect(result.current).not.toHaveProperty('guardAction');
    expect(result.current).not.toHaveProperty('completeWithNickname');
    expect(result.current).not.toHaveProperty('shouldRenderPrompt');
  });
});
