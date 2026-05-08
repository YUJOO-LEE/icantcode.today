import type { ComponentType } from 'react';

// Wraps `() => import('module-with-default-export-component')` into the
// `lazy` callback shape react-router 7 expects (`{ Component }` object).
// Keeps `routes.tsx` declarations to a single line per lazy route and lets
// route components stay default-exported (no router-specific named export).
export function lazyRoute(
  loader: () => Promise<{ default: ComponentType }>,
): () => Promise<{ Component: ComponentType }> {
  return async () => ({ Component: (await loader()).default });
}
