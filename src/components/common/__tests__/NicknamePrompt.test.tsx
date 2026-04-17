import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import NicknamePrompt from '../NicknamePrompt';
import type { ReactNode } from 'react';

vi.mock('@/lib/nicknameGenerator', () => {
  let callCount = 0;
  return {
    generateRandomNickname: () => {
      callCount++;
      return `random_dev_${callCount}`;
    },
  };
});

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

  it('has a random nickname as initial value', () => {
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/) as HTMLInputElement;
    expect(input.value).toMatch(/^random_dev_\d+$/);
  });

  it('sets nickname and calls onComplete', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<NicknamePrompt onComplete={onComplete} />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    await user.clear(input);
    await user.type(input, 'dev_user');
    await user.click(screen.getByText('[제출]'));

    expect(useSessionStore.getState().nickname).toBe('dev_user');
    expect(onComplete).toHaveBeenCalled();
  });

  it('disables confirm when input is cleared', async () => {
    const user = userEvent.setup();
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    await user.clear(input);
    const confirmBtn = screen.getByText('[제출]');
    expect(confirmBtn).toBeDisabled();
  });

  it('reroll button changes the nickname', async () => {
    const user = userEvent.setup();
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/) as HTMLInputElement;
    const initialValue = input.value;

    await user.click(screen.getByText('[다시 뽑기]'));
    expect(input.value).not.toBe(initialValue);
    expect(input.value).toMatch(/^random_dev_\d+$/);
  });

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<NicknamePrompt onComplete={vi.fn()} onCancel={onCancel} />, { wrapper: Wrapper });
    await user.click(screen.getByText('[취소]'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('Escape triggers onCancel', async () => {
    const onCancel = vi.fn();
    render(<NicknamePrompt onComplete={vi.fn()} onCancel={onCancel} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('ignores Enter while IME composition is active', async () => {
    const onComplete = vi.fn();
    render(<NicknamePrompt onComplete={onComplete} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not call onComplete twice on rapid re-submit', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<NicknamePrompt onComplete={onComplete} />, { wrapper: Wrapper });
    const submit = screen.getByText('[제출]');
    await user.click(submit);
    await user.click(submit);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
