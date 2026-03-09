import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      userCode: crypto.randomUUID(),
      nickname: null,
    });
  });

  it('initializes with a UUID userCode', () => {
    const { userCode } = useSessionStore.getState();
    expect(userCode).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('initializes with null nickname', () => {
    const { nickname } = useSessionStore.getState();
    expect(nickname).toBeNull();
  });

  it('hasNickname returns false when nickname is null', () => {
    expect(useSessionStore.getState().hasNickname()).toBe(false);
  });

  it('sets nickname and hasNickname returns true', () => {
    useSessionStore.getState().setNickname('dev_user');
    expect(useSessionStore.getState().nickname).toBe('dev_user');
    expect(useSessionStore.getState().hasNickname()).toBe(true);
  });
});
