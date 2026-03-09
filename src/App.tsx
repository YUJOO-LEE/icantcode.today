import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { useEffect, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { queryClient } from '@/apis/queryClient';
import i18n from '@/lib/i18n';
import { useThemeStore } from '@/stores/themeStore';
import { useStatusStore } from '@/stores/statusStore';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import ErrorFallback from '@/components/common/ErrorFallback';
import Cursor from '@/components/ui/Cursor';

function ThemeInitializer() {
  const initTheme = useThemeStore((s) => s.initTheme);
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  return null;
}

function StatusAnnouncer() {
  const statusMessage = useStatusStore((s) => s.statusMessage);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {statusMessage}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error ?? undefined}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--color-text-muted)]">
      <p>Loading... <Cursor /></p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeInitializer />
        <StatusAnnouncer />
        <ErrorBoundary>
          <Suspense fallback={<Layout><LoadingFallback /></Layout>}>
            <Layout>
              <HomePage />
            </Layout>
          </Suspense>
        </ErrorBoundary>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
