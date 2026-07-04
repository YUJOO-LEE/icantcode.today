import { useCallback } from 'react';
import { useInstallStore } from '@/stores/installStore';
import { isStandalone } from '@/lib/push';

export interface UseInstallPrompt {
  /** Whether a one-tap install nudge can be offered (Chromium, not installed). */
  canInstall: boolean;
  /** Trigger the native install dialog; resolves to true if the user accepted. */
  promptInstall: () => Promise<boolean>;
}

/**
 * One-tap "Add to Home Screen" for Chromium browsers (Android + desktop).
 * Surfaced only as a follow-up after alerts are enabled — never as a competing
 * primary action. iOS Safari never fires `beforeinstallprompt`, so `canInstall`
 * stays false there (that path uses the manual IOSInstallGuide instead).
 */
export function useInstallPrompt(): UseInstallPrompt {
  const deferredPrompt = useInstallStore((s) => s.deferredPrompt);
  const isInstalled = useInstallStore((s) => s.isInstalled);
  const setDeferredPrompt = useInstallStore((s) => s.setDeferredPrompt);

  const canInstall = !isInstalled && deferredPrompt !== null && !isStandalone();

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // The event can only be used once; drop it regardless of the outcome.
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt, setDeferredPrompt]);

  return { canInstall, promptInstall };
}
