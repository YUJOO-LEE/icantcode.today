import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('returns nickname and userCode from store', () => {
    const { result } = renderHook(() => useNicknameGuard());
    expect(result.current.nickname).toBeNull();
    expect(result.current.userCode).toBe('test-uuid');
  });

  it('guardAction shows prompt when no nickname', () => {
    const { result } = renderHook(() => useNicknameGuard());
    const action = vi.fn();

    act(() => {
      result.current.guardAction(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.shouldRenderPrompt).toBe(true);
  });

  it('guardAction calls action when nickname exists', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const { result } = renderHook(() => useNicknameGuard());
    const action = vi.fn();

    act(() => {
      result.current.guardAction(action);
    });

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.shouldRenderPrompt).toBe(false);
  });

  it('dismissPrompt hides the prompt', () => {
    const { result } = renderHook(() => useNicknameGuard());

    act(() => {
      result.current.guardAction(() => {});
    });
    expect(result.current.shouldRenderPrompt).toBe(true);

    act(() => {
      result.current.dismissPrompt();
    });
    expect(result.current.shouldRenderPrompt).toBe(false);
  });

  it('showPromptIfNeeded shows prompt when no nickname', () => {
    const { result } = renderHook(() => useNicknameGuard());

    act(() => {
      result.current.showPromptIfNeeded();
    });

    expect(result.current.shouldRenderPrompt).toBe(true);
  });

  it('showPromptIfNeeded does nothing when nickname exists', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const { result } = renderHook(() => useNicknameGuard());

    act(() => {
      result.current.showPromptIfNeeded();
    });

    expect(result.current.shouldRenderPrompt).toBe(false);
  });

  it('shouldRenderPrompt is false after nickname is set', () => {
    const { result } = renderHook(() => useNicknameGuard());

    act(() => {
      result.current.guardAction(() => {});
    });
    expect(result.current.shouldRenderPrompt).toBe(true);

    act(() => {
      useSessionStore.setState({ nickname: 'testuser' });
    });
    expect(result.current.shouldRenderPrompt).toBe(false);
  });
});
