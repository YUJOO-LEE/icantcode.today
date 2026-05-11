import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createTestWrapper } from '@/tests/wrappers';
import ErrorScreen from '../ErrorScreen';

function renderScreen() {
  const onRetry = vi.fn();
  const onHome = vi.fn();
  const { Wrapper } = createTestWrapper({ withI18n: true });
  const view = render(<ErrorScreen onRetry={onRetry} onHome={onHome} />, {
    wrapper: Wrapper,
  });
  return { ...view, onRetry, onHome };
}

describe('ErrorScreen (resize)', () => {
  it('shows the resize SIGWINCH title', () => {
    renderScreen();
    expect(screen.getByText(/SIGWINCH.*core dumped/)).toBeInTheDocument();
  });

  it('shows the resize cause text and frame label', () => {
    renderScreen();
    expect(screen.getByText('창 크기가 바뀌어 종료됨')).toBeInTheDocument();
    expect(screen.getByText('fall_f::on_resize')).toBeInTheDocument();
  });

  it('exposes retry and home buttons', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /다시하기|retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /나가기|home/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const { onRetry } = renderScreen();
    await userEvent.setup().click(screen.getByRole('button', { name: /다시하기|retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls onHome when home button clicked', async () => {
    const { onHome } = renderScreen();
    await userEvent.setup().click(screen.getByRole('button', { name: /나가기|home/i }));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('autofocuses the retry button on mount', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /다시하기|retry/i })).toHaveFocus();
  });

  it('exposes the screen as an alert region for assistive tech', () => {
    renderScreen();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
