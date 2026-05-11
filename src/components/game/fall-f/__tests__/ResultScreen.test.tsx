import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { useSessionStore } from '@/stores/sessionStore';
import { API_BASE_URL } from '@/lib/constants';
import ResultScreen from '../ResultScreen';

const SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';

function renderScreen(props: Partial<ComponentProps<typeof ResultScreen>> = {}) {
  const onRetry = props.onRetry ?? vi.fn();
  const onHome = props.onHome ?? vi.fn();
  const { Wrapper } = createTestWrapper({ withI18n: true });
  const view = render(
    <ResultScreen
      cause={props.cause ?? 'segfault'}
      score={props.score ?? 99}
      best={props.best ?? 256}
      sessionId={props.sessionId === undefined ? SESSION_ID : props.sessionId}
      onRetry={onRetry}
      onHome={onHome}
    />,
    { wrapper: Wrapper },
  );
  return { ...view, onRetry, onHome };
}

describe('ResultScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

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

  it('autofocuses the nickname input when submission is possible', () => {
    renderScreen();
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  it('submits the score and shows the [OK] confirmation, syncing nickname to session', async () => {
    const user = userEvent.setup();
    renderScreen({ score: 42 });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'tester');
    await user.click(screen.getByRole('button', { name: /submit|제출/i }));

    await waitFor(() => {
      expect(screen.getByText(/\[OK\]/)).toBeInTheDocument();
    });
    expect(useSessionStore.getState().nickname).toBe('tester');
  });

  it('disables submit and shows zero-score notice when score is 0', () => {
    renderScreen({ score: 0 });
    expect(screen.getByText(/0점이면|score is 0/i)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: /submit|제출/i });
    expect(submit).toBeDisabled();
  });

  it('disables submit when sessionId is null', () => {
    renderScreen({ sessionId: null });
    const submit = screen.getByRole('button', { name: /submit|제출/i });
    expect(submit).toBeDisabled();
  });

  it('shows an inline error and stays interactive when submit fails', async () => {
    server.use(
      http.post(`${API_BASE_URL}/games/die`, () => HttpResponse.error()),
    );
    const user = userEvent.setup();
    renderScreen({ score: 42 });

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'tester');
    await user.click(screen.getByRole('button', { name: /submit|제출/i }));

    await waitFor(() => {
      expect(screen.getByText(/제출에 실패|submit failed/i)).toBeInTheDocument();
    });
    // Submit button is re-enabled for retry.
    expect(screen.getByRole('button', { name: /submit|제출/i })).toBeEnabled();
  });

  it('reroll changes the input value', async () => {
    const user = userEvent.setup();
    renderScreen();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const before = input.value;
    // Reroll multiple times since the random pool can collide on a single try.
    for (let i = 0; i < 5; i += 1) {
      await user.click(screen.getByRole('button', { name: /reroll|다시 뽑기/i }));
      if (input.value !== before) break;
    }
    expect(input.value).not.toBe(before);
  });

  it('calls onRetry when retry is clicked', async () => {
    const user = userEvent.setup();
    const { onRetry } = renderScreen();
    await user.click(screen.getByRole('button', { name: /retry|다시하기/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls onHome when exit is clicked', async () => {
    const user = userEvent.setup();
    const { onHome } = renderScreen();
    await user.click(screen.getByRole('button', { name: /exit|나가기/i }));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('prefills input with session nickname when present', () => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: 'preexisting' });
    renderScreen();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('preexisting');
  });
});
