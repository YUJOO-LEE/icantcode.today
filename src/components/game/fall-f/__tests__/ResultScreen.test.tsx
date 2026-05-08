import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createTestWrapper } from '@/tests/wrappers';
import ResultScreen from '../ResultScreen';

function renderScreen(props: Partial<ComponentProps<typeof ResultScreen>> = {}) {
  const onRetry = props.onRetry ?? vi.fn();
  const onHome = props.onHome ?? vi.fn();
  const { Wrapper } = createTestWrapper({ withI18n: true });
  const view = render(
    <ResultScreen
      cause={props.cause ?? 'segfault'}
      score={props.score ?? 99}
      best={props.best ?? 256}
      onRetry={onRetry}
      onHome={onHome}
    />,
    { wrapper: Wrapper },
  );
  return { ...view, onRetry, onHome };
}

describe('ResultScreen', () => {
  it('renders SEGFAULT title for segfault cause', () => {
    renderScreen({ cause: 'segfault' });
    expect(screen.getByText(/\[SEGFAULT\]/)).toBeInTheDocument();
    expect(screen.getByText(/segmentation fault/)).toBeInTheDocument();
  });

  it('renders TIMEOUT title for timeout cause', () => {
    renderScreen({ cause: 'timeout' });
    expect(screen.getByText(/\[TIMEOUT\]/)).toBeInTheDocument();
  });

  it('shows the score and best values', () => {
    renderScreen({ score: 99, best: 256 });
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.getByText('256')).toBeInTheDocument();
  });

  it('shows the death cause in the active language', () => {
    renderScreen({ cause: 'segfault' });
    expect(screen.getByText(/추락|fell through/)).toBeInTheDocument();
  });

  it('focuses the retry button by default', () => {
    renderScreen();
    const retry = screen.getByRole('button', { name: /retry|다시/ });
    expect(retry).toHaveFocus();
  });

  it('calls onRetry when retry is clicked', async () => {
    const user = userEvent.setup();
    const { onRetry } = renderScreen();
    await user.click(screen.getByRole('button', { name: /retry|다시/ }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls onHome when exit is clicked', async () => {
    const user = userEvent.setup();
    const { onHome } = renderScreen();
    await user.click(screen.getByRole('button', { name: /exit|나가기/ }));
    expect(onHome).toHaveBeenCalledOnce();
  });
});
