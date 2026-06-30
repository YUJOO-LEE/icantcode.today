import { create } from 'zustand';
import type { BeforeInstallPromptEvent } from '@/types/pwa';

interface InstallState {
  /** Captured (and deferred) `beforeinstallprompt` event, or null if unavailable. */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** Set once the app has been installed this session. */
  isInstalled: boolean;
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setInstalled: (installed: boolean) => void;
}

/**
 * Holds the deferred install prompt so the post-subscribe "add to home screen"
 * nudge can trigger it on a user gesture. Populated from `beforeinstallprompt`
 * / `appinstalled` listeners registered in `main.tsx`. Memory only — the event
 * is single-use.
 */
export const useInstallStore = create<InstallState>((set) => ({
  deferredPrompt: null,
  isInstalled: false,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setInstalled: (isInstalled) => set({ isInstalled }),
}));
