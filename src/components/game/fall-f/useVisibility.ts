import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

function getSnapshot(): boolean {
  return typeof document === 'undefined' ? false : document.hidden;
}

export function usePageHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
