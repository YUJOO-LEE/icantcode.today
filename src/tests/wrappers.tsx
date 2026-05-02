import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

type QueryClientConfig = ConstructorParameters<typeof QueryClient>[0];

interface CreateTestWrapperOptions {
  /** Wrap children in `<I18nextProvider>`. Default: false. */
  withI18n?: boolean;
  /**
   * Override the QueryClient configuration. Defaults to test-friendly settings:
   * `retry: false`, `gcTime: 0`, mutations also `retry: false`. Pass an
   * explicit object to use a different configuration (e.g. `gcTime: 60_000`
   * when seeding cache fixtures via `setQueryData` without an active observer).
   */
  queryClientConfig?: QueryClientConfig;
}

const DEFAULT_TEST_QUERY_CLIENT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
};

/**
 * Test render wrapper providing a fresh QueryClient (and optionally i18n).
 * Use in `render(..., { wrapper: Wrapper })` and `renderHook(..., { wrapper: Wrapper })`.
 *
 * Returns `{ Wrapper, client }` so tests that need to seed the cache or read
 * post-mutation state can grab the QueryClient directly.
 */
export function createTestWrapper(options: CreateTestWrapperOptions = {}) {
  const { withI18n = false, queryClientConfig = DEFAULT_TEST_QUERY_CLIENT_CONFIG } = options;
  const client = new QueryClient(queryClientConfig);
  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withI18n ? (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    ) : (
      children
    );
    return <QueryClientProvider client={client}>{inner}</QueryClientProvider>;
  }
  return { Wrapper, client };
}
