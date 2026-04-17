import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import CommentForm from '../CommentForm';
import { API_BASE_URL } from '@/lib/constants';
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

describe('CommentForm', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

  it('renders comment input with korean placeholder', () => {
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText(/댓글을 입력/)).toBeInTheDocument();
  });

  it('shows nickname prompt when submitting without nickname', async () => {
    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, 'nice post{enter}');

    await waitFor(() => {
      expect(screen.getByText(/set-nickname/)).toBeInTheDocument();
    });
  });

  it('submits comment and clears input when nickname is set', async () => {
    useSessionStore.setState({ nickname: 'tester' });
    let capturedBody: unknown = null;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    await user.type(input, 'hello world{enter}');

    await waitFor(() => {
      expect(input.value).toBe('');
    });
    expect(capturedBody).toMatchObject({ content: 'hello world', author: 'tester' });
  });

  it('shows error message on submission failure', async () => {
    useSessionStore.setState({ nickname: 'tester' });
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, 'will fail{enter}');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('clears input when Escape pressed', async () => {
    useSessionStore.setState({ nickname: 'tester' });
    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    await user.type(input, 'typing...');
    expect(input.value).toBe('typing...');
    await user.keyboard('{Escape}');
    expect(input.value).toBe('');
  });

  it('does not submit while IME composition is active', async () => {
    useSessionStore.setState({ nickname: 'tester' });
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => {
        called = true;
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, 'hangul');
    // isComposing=true blocks Enter submission
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(false);
  });

  it('does not submit whitespace-only content', async () => {
    useSessionStore.setState({ nickname: 'tester' });
    let called = false;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => {
        called = true;
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, '   {enter}');

    // small delay to ensure no request fired
    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(false);
  });
});
