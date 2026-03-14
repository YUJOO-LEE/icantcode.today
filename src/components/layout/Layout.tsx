import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
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
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
