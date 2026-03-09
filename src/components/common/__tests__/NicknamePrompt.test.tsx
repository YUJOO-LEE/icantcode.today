import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import NicknamePrompt from '../NicknamePrompt';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('NicknamePrompt', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

  it('renders nickname input', () => {
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText(/닉네임을 입력/)).toBeInTheDocument();
  });

  it('sets nickname and calls onComplete', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<NicknamePrompt onComplete={onComplete} />, { wrapper: Wrapper });

    await user.type(screen.getByPlaceholderText(/닉네임을 입력/), 'dev_user');
    await user.click(screen.getByRole('button', { name: /확인/ }));

    expect(useSessionStore.getState().nickname).toBe('dev_user');
    expect(onComplete).toHaveBeenCalled();
  });

  it('disables confirm when input is empty', () => {
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: Wrapper });
    const confirmBtn = screen.getByRole('button', { name: /확인/ });
    expect(confirmBtn).toBeDisabled();
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<NicknamePrompt onComplete={vi.fn()} onCancel={onCancel} />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /취소/ }));
    expect(onCancel).toHaveBeenCalled();
  });
});
