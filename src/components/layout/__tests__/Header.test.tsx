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

  describe('primary nav by route', () => {
    function WrapperAt(path: string) {
      return function ({ children }: { children: ReactNode }) {
        return (
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
          </I18nextProvider>
        );
      };
    }

    it('on `/` shows [게임] linking to /game', () => {
      render(<Header />, { wrapper: WrapperAt('/') });
      const link = screen.getByRole('link', { name: /\[게임\]/ });
      expect(link).toHaveAttribute('href', '/game');
    });

    it('on `/game` shows [홈] linking to /', () => {
      render(<Header />, { wrapper: WrapperAt('/game') });
      const link = screen.getByRole('link', { name: /\[홈\]/ });
      expect(link).toHaveAttribute('href', '/');
    });

    it('on `/game/fall-f` shows [게임] linking to the game catalog (/game), not home', () => {
      render(<Header />, { wrapper: WrapperAt('/game/fall-f') });
      const link = screen.getByRole('link', { name: /\[게임\]/ });
      expect(link).toHaveAttribute('href', '/game');
    });
  });
});
