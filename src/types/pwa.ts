/**
 * `beforeinstallprompt` is a non-standard Chromium event not yet in the DOM
 * lib types. Declaring it here gives the install flow real types and makes
 * `window.addEventListener('beforeinstallprompt', ...)` type-safe.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
