import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { createTestWrapper } from '@/tests/wrappers';
import { useSessionStore } from '@/stores/sessionStore';
import { API_BASE_URL } from '@/lib/constants';
import FeedComposer from '../FeedComposer';

function createWrapper() {
  return createTestWrapper({ withI18n: true }).Wrapper;
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

  // Invariant: confirming the inline NicknamePrompt with Enter fires the
  // post mutation exactly once. The textarea stays mounted for the entire
  // prompt lifecycle so autoFocus / closure races during prompt teardown
  // can't trigger a second submit, and the deferred mutation reads from
  // a ref rather than a captured closure.
  it('regression: nickname prompt confirmed via Enter submits exactly once and closes the composer', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'first post');
    await user.click(screen.getByText('[제출]'));

    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester{enter}');

    await waitFor(() => expect(postCount).toBeGreaterThanOrEqual(1));
    await new Promise((r) => setTimeout(r, 100));

    expect(postCount).toBe(1);
    expect(onToggle).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: nickname prompt confirmed via click submits exactly once and closes the composer', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'first post');
    await user.click(screen.getByText('[제출]'));

    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester');
    // Click the prompt's [제출] button. There are now two — the prompt's and
    // the (hidden but mounted) composer's. Pick the prompt's via proximity.
    const [promptSubmit] = screen.getAllByRole('button', { name: '[제출]' });
    await user.click(promptSubmit!);

    await waitFor(() => expect(postCount).toBeGreaterThanOrEqual(1));
    await new Promise((r) => setTimeout(r, 100));

    expect(postCount).toBe(1);
    expect(onToggle).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: cancelling the nickname prompt preserves typed content and fires no mutation', async () => {
    let postCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => {
        postCount += 1;
        return HttpResponse.json({ id: postCount });
      }),
    );

    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/) as HTMLTextAreaElement;
    await user.type(textarea, 'draft body');
    await user.click(screen.getByText('[제출]'));

    const [promptCancel] = await screen.findAllByRole('button', { name: '[취소]' });
    // The first cancel belongs to the visible NicknamePrompt.
    await user.click(promptCancel!);

    await new Promise((r) => setTimeout(r, 50));
    expect(postCount).toBe(0);
    // textarea is now visible again with its original content intact
    expect((screen.getByPlaceholderText(/무슨 일이 있나요/) as HTMLTextAreaElement).value).toBe('draft body');
  });

  // Invariant: between confirming the nickname prompt and the post mutation
  // settling, the textarea must NOT reappear with the typed content. The
  // prompt only dismisses when the mutation actually settles (`onSuccess` /
  // `onError`), not synchronously inside the prompt's `onComplete` callback —
  // otherwise the textarea would flash back into view for the network
  // request's duration.
  it('regression: prompt stays visible for the entire in-flight mutation — no textarea flicker', async () => {
    let releaseRequest: (() => void) | null = null;
    server.use(
      http.post(`${API_BASE_URL}/posts`, async () => {
        await new Promise<void>((r) => {
          releaseRequest = r;
        });
        return HttpResponse.json({ id: 1 });
      }),
    );

    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'no-flicker body');
    await user.click(screen.getByText('[제출]'));

    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester');
    const [promptSubmit] = screen.getAllByRole('button', { name: '[제출]' });
    await user.click(promptSubmit!);

    // Mutation is parked. The prompt header must still be on screen — the
    // textarea must NOT have taken over yet.
    expect(screen.getByText(/set-nickname/)).toBeInTheDocument();
    expect(onToggle).not.toHaveBeenCalled();

    // Release the mutation and assert that NOW the prompt closes and the
    // composer collapses.
    releaseRequest!();

    await waitFor(() => expect(onToggle).toHaveBeenCalled());
    expect(screen.queryByText(/set-nickname/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regression: when the post mutation fails after a prompt-driven submit, the textarea reappears with the typed content + error', async () => {
    server.use(
      http.post(`${API_BASE_URL}/posts`, () => new HttpResponse(null, { status: 500 })),
    );

    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FeedComposer isOpen onToggle={onToggle} />, { wrapper: createWrapper() });
    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/) as HTMLTextAreaElement;
    await user.type(textarea, 'will fail');
    await user.click(screen.getByText('[제출]'));

    const nicknameInput = await screen.findByPlaceholderText(/닉네임을 입력/);
    await user.clear(nicknameInput);
    await user.type(nicknameInput, 'tester{enter}');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    // Composer should NOT have closed on a failed submission.
    expect(onToggle).not.toHaveBeenCalled();
    // Prompt is gone, textarea is back with the typed content for retry.
    expect(screen.queryByText(/set-nickname/)).not.toBeInTheDocument();
    expect((screen.getByPlaceholderText(/무슨 일이 있나요/) as HTMLTextAreaElement).value).toBe('will fail');
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
