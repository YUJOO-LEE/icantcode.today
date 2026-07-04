import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInstallStore } from '@/stores/installStore';
import type { BeforeInstallPromptEvent } from '@/types/pwa';
import { useInstallPrompt } from '../useInstallPrompt';

vi.mock('@/lib/push', () => ({
  isStandalone: vi.fn(() => false),
}));

import { isStandalone } from '@/lib/push';

function makeEvent(outcome: 'accepted' | 'dismissed') {
  return {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  } as unknown as BeforeInstallPromptEvent;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isStandalone).mockReturnValue(false);
  useInstallStore.setState({ deferredPrompt: null, isInstalled: false });
});

describe('useInstallPrompt', () => {
  it('cannot install when no prompt has been captured', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('can install once a deferred prompt exists', () => {
    useInstallStore.setState({ deferredPrompt: makeEvent('accepted') });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(true);
  });

  it('cannot install when already running standalone', () => {
    vi.mocked(isStandalone).mockReturnValue(true);
    useInstallStore.setState({ deferredPrompt: makeEvent('accepted') });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('cannot install after the app is marked installed', () => {
    useInstallStore.setState({ deferredPrompt: makeEvent('accepted'), isInstalled: true });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it('prompts, returns true on accept, and clears the single-use event', async () => {
    const event = makeEvent('accepted');
    useInstallStore.setState({ deferredPrompt: event });
    const { result } = renderHook(() => useInstallPrompt());

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(accepted).toBe(true);
    expect(useInstallStore.getState().deferredPrompt).toBeNull();
  });

  it('returns false when the user dismisses the prompt', async () => {
    useInstallStore.setState({ deferredPrompt: makeEvent('dismissed') });
    const { result } = renderHook(() => useInstallPrompt());

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.promptInstall();
    });

    expect(accepted).toBe(false);
  });
});
