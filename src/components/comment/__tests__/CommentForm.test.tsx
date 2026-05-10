import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { createTestWrapper } from '@/tests/wrappers';
import { useSessionStore } from '@/stores/sessionStore';
import CommentForm from '../CommentForm';
import { API_BASE_URL } from '@/lib/constants';

function createWrapper() {
  return createTestWrapper({ withI18n: true }).Wrapper;
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

  // Invariant: the "submit-without-nickname → confirm nickname → auto-submit"
  // flow fires exactly one mutation. The comment input stays mounted for the
  // entire prompt lifecycle so a remount with `autoFocus` can't catch
  // Enter key-repeat, and submission is driven off a ref to keep the in-flight
  // value stable.
  it('regression: nickname prompt confirmed via Enter submits exactly once and clears input', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => {
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;

    // Type content, press Enter -> nickname prompt should appear
    await user.type(input, 'hello{enter}');
    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/) as HTMLInputElement;

    // Type nickname, press Enter to confirm (this is the trigger of the original bug)
    await user.type(nicknameInput, 'tester{enter}');

    await waitFor(() => {
      expect(postCount).toBeGreaterThanOrEqual(1);
    });
    // small grace window for any straggler request to (incorrectly) fire
    await new Promise((r) => setTimeout(r, 100));

    expect(postCount).toBe(1);
    const reborn = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    expect(reborn.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: nickname prompt confirmed via mouse click submits exactly once and clears input', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => {
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;

    await user.type(input, 'hello{enter}');
    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/) as HTMLInputElement;
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester');
    await user.click(screen.getByRole('button', { name: '[제출]' }));

    await waitFor(() => {
      expect(postCount).toBeGreaterThanOrEqual(1);
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(postCount).toBe(1);
    const reborn = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    expect(reborn.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: Enter key-repeat during nickname confirm must not register the comment twice or surface an error', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, async () => {
        // simulate small network latency so the key-repeat event lands while pending
        await new Promise((r) => setTimeout(r, 30));
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;

    await user.type(input, 'hello{enter}');
    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/) as HTMLInputElement;
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester');

    // Press Enter on nickname input -> triggers prompt confirm + mutation
    fireEvent.keyDown(nicknameInput, { key: 'Enter' });

    // Simulate a key-repeat Enter that lands on whichever input is now focused
    // (after the prompt unmounts and the comment input remounts with autoFocus).
    // In production this is what fires the second mutation attempt.
    await new Promise((r) => setTimeout(r, 5));
    const focused = document.activeElement as HTMLElement | null;
    if (focused) {
      fireEvent.keyDown(focused, { key: 'Enter' });
    }

    await waitFor(() => {
      expect(postCount).toBeGreaterThanOrEqual(1);
    });
    await new Promise((r) => setTimeout(r, 200));

    expect(postCount).toBe(1);
    const reborn = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    expect(reborn.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // Mirror of the FeedComposer no-flicker contract: the prompt must stay
  // visible for the entire in-flight mutation so the user does not see the
  // comment input briefly reappear with the typed content between confirming
  // the nickname and the network response settling.
  it('regression: prompt stays visible for the entire in-flight mutation — no comment-input flicker', async () => {
    let releaseRequest: (() => void) | null = null;
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, async () => {
        await new Promise<void>((r) => {
          releaseRequest = r;
        });
        return HttpResponse.json({ id: 1 });
      }),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, 'no-flicker comment{enter}');
    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester{enter}');

    // Mutation parked. The prompt header must still be on screen.
    expect(screen.getByText(/set-nickname/)).toBeInTheDocument();

    releaseRequest!();

    await waitFor(() => {
      expect(screen.queryByText(/set-nickname/)).not.toBeInTheDocument();
    });
    const reborn = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    expect(reborn.value).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: when the comment mutation fails after a prompt-driven submit, the input reappears with the typed content + error', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts/1/comments`, () => new HttpResponse(null, { status: 500 })),
    );

    const user = userEvent.setup();
    render(<CommentForm postId={1} />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText(/댓글을 입력/);
    await user.type(input, 'will fail{enter}');
    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester{enter}');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByText(/set-nickname/)).not.toBeInTheDocument();
    const reborn = screen.getByPlaceholderText(/댓글을 입력/) as HTMLInputElement;
    expect(reborn.value).toBe('will fail');
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
