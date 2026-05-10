import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import CatalogPage from '../CatalogPage';

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

describe('CatalogPage', () => {
  it('renders the `ls -la /game/` heading', () => {
    render(<CatalogPage />, { wrapper: Wrapper });
    expect(screen.getByText(/ls -la \/game\//)).toBeInTheDocument();
  });

  it('lists fall-f as a link to /game/fall-f', () => {
    render(<CatalogPage />, { wrapper: Wrapper });
    const link = screen.getByRole('link', { name: /fall-f/i });
    expect(link).toHaveAttribute('href', '/game/fall-f');
  });

  it('shows the fall-f subtitle from i18n', () => {
    render(<CatalogPage />, { wrapper: Wrapper });
    expect(screen.getByText(/follow the fall/)).toBeInTheDocument();
  });

  it('shows a placeholder row for upcoming entries', () => {
    render(<CatalogPage />, { wrapper: Wrapper });
    expect(screen.getByText(/more coming/i)).toBeInTheDocument();
  });
});
