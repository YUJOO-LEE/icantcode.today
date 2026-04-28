import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import Footer from '../Footer';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('Footer', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
    void i18n.changeLanguage('ko');
  });

  it('renders the SSH-style prompt with current copyright', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText(/guest@icantcode\.today:~\$/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
  });

  it('renders all keyboard shortcut labels', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText(/\[N\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[T\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[L\]/)).toBeInTheDocument();
  });

  it('exposes the GitHub repo link with safe rel and aria-label', () => {
    render(<Footer />, { wrapper: Wrapper });
    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveAttribute('href', 'https://github.com/YUJOO-LEE/icantcode.today');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('uses the [GITHUB] bracketed label so it is visually consistent with shortcut tags', () => {
    render(<Footer />, { wrapper: Wrapper });
    const link = screen.getByRole('link', { name: /GitHub/i });
    expect(link).toHaveTextContent('[GITHUB]');
  });
});
