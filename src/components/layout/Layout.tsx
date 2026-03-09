import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background font-mono antialiased">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
