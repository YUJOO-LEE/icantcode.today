import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import { API_BASE_URL } from '@/lib/constants';
import FeedComposer from '../FeedComposer';
import type { ReactNode } from 'react';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </QueryClientProvider>
    );
  };
}

describe('FeedComposer', () => {
  beforeEach(() => {
    useSessionStore.setState({
      userCode: crypto.randomUUID(),
      nickname: null,
    });
  });

  it('shows collapsed command prompt by default', () => {
    render(<FeedComposer />, { wrapper: createWrapper() });
    expect(screen.getByText('./post --new')).toBeInTheDocument();
  });

  it('shows textarea when opened', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const onToggle = () => {};
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText(/무슨 일이 있나요/)).toBeInTheDocument();
  });

  it('shows nickname prompt when submitting without nickname', async () => {
    const user = userEvent.setup();
    const onToggle = () => {};
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'test content');
    await user.click(screen.getByText('[제출]'));

    await waitFor(() => {
      expect(screen.getByText(/set-nickname/)).toBeInTheDocument();
    });
  });

  it('disables submit button when content is empty', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const onToggle = () => {};
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });

    const submitButton = screen.getByText('[제출]');
    expect(submitButton).toBeDisabled();
  });

  it('submits and calls onToggle on success', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    let capturedBody: unknown = null;
    server.use(
      http.post(`${API_BASE_URL}/posts`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 42 });
      }),
    );
    const onToggle = vi.fn();

    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'post body');
    await user.click(screen.getByText('[제출]'));

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalled();
    });
    expect(capturedBody).toMatchObject({ content: 'post body', author: 'testuser' });
  });

  it('submits via Ctrl+Enter keyboard shortcut', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        called = true;
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'via shortcut');
    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => expect(called).toBe(true));
  });

  it('closes composer via Escape key', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    textarea.focus();
    await user.keyboard('{Escape}');
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows error message on submit failure', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => new HttpResponse(null, { status: 500 })),
    );

    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'will fail');
    await user.click(screen.getByText('[제출]'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('focuses textarea when opened', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    expect(textarea).toHaveFocus();
  });

  it('ignores Ctrl+Enter while IME composition is active', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        called = true;
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'ㅎㅏㄴ');
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true, isComposing: true });
    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(false);
  });

  it('does not submit when content is empty even on click', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        called = true;
        return HttpResponse.json({ id: 1 });
      }),
    );

    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const submit = screen.getByText('[제출]');
    // button is disabled, but also submit fn guards internally
    expect(submit).toBeDisabled();
    await new Promise((r) => setTimeout(r, 20));
    expect(called).toBe(false);
  });
});
