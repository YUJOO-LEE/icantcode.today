import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import LanguageInitializer from '@/components/common/LanguageInitializer';
import LoadingFallback from '@/components/common/LoadingFallback';
import Header from './Header';
import Footer from './Footer';

function Layout() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-background font-mono antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-background focus:text-xs focus:rounded"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-6">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
          <LanguageInitializer />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
