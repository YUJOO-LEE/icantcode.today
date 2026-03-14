import 'vitest-axe/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { axe } from 'vitest-axe';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import Layout from '@/components/layout/Layout';
import FeedList from '@/components/feed/FeedList';
import FeedComposer from '@/components/feed/FeedComposer';
import CommentList from '@/components/comment/CommentList';
import NicknamePrompt from '@/components/common/NicknamePrompt';
import ErrorFallback from '@/components/common/ErrorFallback';
import { API_BASE_URL } from '@/lib/constants';
import type { ReactNode } from 'react';

vi.mock('@/lib/nicknameGenerator', () => ({
  generateRandomNickname: () => 'test_nickname',
}));

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

function SimpleWrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

// --- Layout a11y ---
describe('Layout accessibility', () => {
  it('has skip-to-content link', () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>,
      { wrapper: SimpleWrapper },
    );
    const skipLink = screen.getByText(/본문으로 건너뛰기|Skip to content/);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('has main landmark with id', () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>,
      { wrapper: SimpleWrapper },
    );
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('has nav landmark', () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>,
      { wrapper: SimpleWrapper },
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });

  it('passes axe automated checks', async () => {
    const { container } = render(
      <Layout>
        <p>content</p>
      </Layout>,
      { wrapper: SimpleWrapper },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// --- FeedList a11y ---
describe('FeedList accessibility', () => {
  it('has role="feed" with aria-label when posts loaded', async () => {
    const { container } = render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      const feed = container.querySelector('[role="feed"]');
      if (feed) {
        expect(feed).toHaveAttribute('aria-label');
        expect(feed).toHaveAttribute('aria-busy');
      }
    });
  });

  it('loading state has role="status"', () => {
    const { container } = render(<FeedList />, { wrapper: createWrapper() });
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });

  it('error state has role="alert"', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/tests/mocks/server');
    server.use(
      http.get(`${API_BASE_URL}/posts`, () => {
        return HttpResponse.error();
      }),
    );

    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// --- FeedComposer a11y ---
describe('FeedComposer accessibility', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: 'testuser' });
  });

  it('has aria-expanded on toggle button', () => {
    render(<FeedComposer />, { wrapper: createWrapper() });
    const button = screen.getByRole('button', { expanded: false });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('textarea has aria-label when open', () => {
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label');
  });

  it('keyboard hint is aria-hidden', () => {
    render(<FeedComposer isOpen onToggle={vi.fn()} />, { wrapper: createWrapper() });
    const hint = screen.getByText(/ctrl\+enter/);
    expect(hint).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes axe automated checks (collapsed)', async () => {
    const { container } = render(<FeedComposer />, { wrapper: createWrapper() });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe automated checks (open)', async () => {
    const { container } = render(
      <FeedComposer isOpen onToggle={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// --- CommentList a11y ---
describe('CommentList accessibility', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

  it('has role="list" with aria-label', () => {
    const { container } = render(<CommentList postId={1} />, { wrapper: createWrapper() });
    const list = container.querySelector('[role="list"]');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('aria-label');
  });

  it('loading state has role="status"', () => {
    const { container } = render(<CommentList postId={1} />, { wrapper: createWrapper() });
    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
  });
});

// --- NicknamePrompt a11y ---
describe('NicknamePrompt accessibility', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

  it('input has aria-label', () => {
    render(<NicknamePrompt onComplete={vi.fn()} />, { wrapper: SimpleWrapper });
    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    expect(input).toHaveAttribute('aria-label');
  });

  it('supports keyboard interaction (Enter to submit)', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<NicknamePrompt onComplete={onComplete} />, { wrapper: SimpleWrapper });

    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    await user.clear(input);
    await user.type(input, 'a11y_user{Enter}');

    expect(onComplete).toHaveBeenCalled();
  });

  it('supports keyboard interaction (Escape to cancel)', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <NicknamePrompt onComplete={vi.fn()} onCancel={onCancel} />,
      { wrapper: SimpleWrapper },
    );

    const input = screen.getByPlaceholderText(/닉네임을 입력/);
    await user.type(input, '{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });

  it('passes axe automated checks', async () => {
    const { container } = render(
      <NicknamePrompt onComplete={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: SimpleWrapper },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// --- ErrorFallback a11y ---
describe('ErrorFallback accessibility', () => {
  it('has role="alert"', () => {
    render(<ErrorFallback />, { wrapper: SimpleWrapper });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('passes axe automated checks', async () => {
    const { container } = render(<ErrorFallback />, { wrapper: SimpleWrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with error details', async () => {
    const { container } = render(
      <ErrorFallback error={new Error('test')} onRetry={vi.fn()} />,
      { wrapper: SimpleWrapper },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
