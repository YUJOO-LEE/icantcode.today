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

  it('dismiss prevents reopen until next guardAction call', () => {
    const { result } = renderHook(() => useNicknameGuard());
    const action = vi.fn();

    // guardAction shows prompt
    act(() => {
      result.current.guardAction(action);
    });
    expect(result.current.shouldRenderPrompt).toBe(true);

    // dismiss hides prompt
    act(() => {
      result.current.dismissPrompt();
    });
    expect(result.current.shouldRenderPrompt).toBe(false);

    // another guardAction re-shows prompt
    act(() => {
      result.current.guardAction(action);
    });
    expect(result.current.shouldRenderPrompt).toBe(true);
    expect(action).not.toHaveBeenCalled();
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

  it('completeWithNickname runs the pending action and hides prompt', () => {
    const { result } = renderHook(() => useNicknameGuard());
    const action = vi.fn();

    act(() => {
      result.current.guardAction(action);
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.shouldRenderPrompt).toBe(true);

    act(() => {
      result.current.completeWithNickname();
    });
    expect(action).toHaveBeenCalledOnce();
    expect(result.current.shouldRenderPrompt).toBe(false);
  });

  it('completeWithNickname is a no-op when no action is pending', () => {
    const { result } = renderHook(() => useNicknameGuard());
    expect(() => {
      act(() => {
        result.current.completeWithNickname();
      });
    }).not.toThrow();
  });
});
