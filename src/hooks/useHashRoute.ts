import { useSyncExternalStore } from 'react';

function getHashPath(): string {
  if (typeof window === 'undefined') return '/';
  const raw = window.location.hash;
  if (!raw || raw === '#' || raw === '#/') return '/';
  return raw.startsWith('#') ? raw.slice(1) : raw;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, getHashPath, () => '/');
}

export function navigate(to: string): void {
  if (typeof window === 'undefined') return;
  const target = to.startsWith('#') ? to : `#${to}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}
