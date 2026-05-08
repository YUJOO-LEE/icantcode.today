import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { createBrowserRouter, matchRoutes } from 'react-router';
import App from './App';
import { routes } from './routes';
import i18n from './lib/i18n';
import ErrorFallback from './components/common/ErrorFallback';
import './styles/globals.css';

type HydrationData = NonNullable<Parameters<typeof createBrowserRouter>[1]>['hydrationData'];

declare global {
  interface Window {
    __staticRouterHydrationData?: HydrationData;
  }
}

// Resolve any lazy route modules matching the current URL before instantiating
// the router. This lets prerendered HTML hydrate cleanly: the same Component
// the server rendered is already available on the client at hydrate-time.
async function bootstrap() {
  const matches = matchRoutes(routes, window.location.pathname) ?? [];
  await Promise.all(
    matches.map(async (m) => {
      const lazyFn = m.route.lazy;
      if (typeof lazyFn !== 'function') return;
      const result = await lazyFn();
      Object.assign(m.route, result, { lazy: undefined });
    }),
  );

  const router = createBrowserRouter(routes, {
    hydrationData: window.__staticRouterHydrationData,
  });

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('#root not found');

  const tree = (
    <React.StrictMode>
      <App router={router} />
    </React.StrictMode>
  );

  if (rootEl.hasChildNodes()) {
    ReactDOM.hydrateRoot(rootEl, tree);
  } else {
    ReactDOM.createRoot(rootEl).render(tree);
  }
}

function renderBootstrapError(err: unknown) {
  console.error('App bootstrap failed:', err);
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  // Discard any partial server-rendered DOM — hydration is no longer viable.
  rootEl.innerHTML = '';
  const error = err instanceof Error ? err : new Error(String(err));
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <ErrorFallback error={error} onRetry={() => window.location.reload()} />
      </I18nextProvider>
    </React.StrictMode>,
  );
}

bootstrap().catch(renderBootstrapError);
