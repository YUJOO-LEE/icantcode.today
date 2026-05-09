import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeStore } from '@/stores/themeStore';
import Header from '../Header';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

function GameRouteWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/game']}>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

describe('Header', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
    useThemeStore.setState({ theme: 'dark' });
    void i18n.changeLanguage('ko');
  });

  it('shows "guest@icantcode.today" when no nickname is set', () => {
    render(<Header />, { wrapper: Wrapper });
    expect(screen.getByText('guest@icantcode.today')).toBeInTheDocument();
  });

  it('shows the nickname@icantcode.today when nickname is set', () => {
    useSessionStore.setState({ nickname: 'morgan' });
    render(<Header />, { wrapper: Wrapper });
    expect(screen.getByText('morgan@icantcode.today')).toBeInTheDocument();
  });

  it('toggles language on click', async () => {
    const user = userEvent.setup();
    render(<Header />, { wrapper: Wrapper });
    // When language is ko, the toggle button shows the *target* language label (English)
    const langBtn = screen.getByRole('button', { name: /English로 전환/ });
    await user.click(langBtn);
    expect(i18n.language).toBe('en');
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    render(<Header />, { wrapper: Wrapper });
    const themeBtn = screen.getByRole('button', { name: /밝게 모드로 전환/ });
    await user.click(themeBtn);
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('has a nav landmark labeled "사이트 탐색"', () => {
    render(<Header />, { wrapper: Wrapper });
    const nav = screen.getByLabelText('사이트 탐색');
    expect(nav.tagName.toLowerCase()).toBe('nav');
  });

  it('shows the [게임] primary nav link on the home route', () => {
    render(<Header />, { wrapper: Wrapper });
    const link = screen.getByRole('link', { name: '[게임]' });
    expect(link).toHaveAttribute('href', '/game');
  });

  it('swaps the primary nav to [뒤로] → / when on a /game route', () => {
    render(<Header />, { wrapper: GameRouteWrapper });
    const link = screen.getByRole('link', { name: '[뒤로]' });
    expect(link).toHaveAttribute('href', '/');
  });
});
