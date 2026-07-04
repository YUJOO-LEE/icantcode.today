import { describe, it, expect, beforeEach } from 'vitest';
import { useInstallStore } from '../installStore';
import type { BeforeInstallPromptEvent } from '@/types/pwa';

const fakeEvent = { prompt: async () => {} } as unknown as BeforeInstallPromptEvent;

describe('installStore', () => {
  beforeEach(() => {
    useInstallStore.setState({ deferredPrompt: null, isInstalled: false });
  });

  it('starts with no deferred prompt and not installed', () => {
    expect(useInstallStore.getState().deferredPrompt).toBeNull();
    expect(useInstallStore.getState().isInstalled).toBe(false);
  });

  it('stores and clears the deferred prompt', () => {
    useInstallStore.getState().setDeferredPrompt(fakeEvent);
    expect(useInstallStore.getState().deferredPrompt).toBe(fakeEvent);
    useInstallStore.getState().setDeferredPrompt(null);
    expect(useInstallStore.getState().deferredPrompt).toBeNull();
  });

  it('marks the app as installed', () => {
    useInstallStore.getState().setInstalled(true);
    expect(useInstallStore.getState().isInstalled).toBe(true);
  });
});
