import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect } from 'vitest';
import i18n from '@/lib/i18n';
import FeedItem from '../FeedItem';
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

const mockPost = {
  id: 1,
  content: 'Test post',
  author: 'testuser',
  commentCount: 3,
  createdAt: new Date().toISOString(),
};

describe('FeedItem', () => {
  it('renders post content and author in ls -la style', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    expect(screen.getByText('Test post')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('-rw-r--r--')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows reply and show count buttons', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    expect(screen.getByText('[답글]')).toBeInTheDocument();
    expect(screen.getByText('[보기 3]')).toBeInTheDocument();
  });

  it('toggles comments on click', async () => {
    const user = userEvent.setup();
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });

    const replyBtn = screen.getByText('[답글]');
    await user.click(replyBtn);

    expect(screen.getByPlaceholderText(/댓글을 입력/)).toBeInTheDocument();
  });

  it('has aria-label on comment toggle button', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    const btn = screen.getByLabelText(/댓글/);
    expect(btn).toBeInTheDocument();
  });
});
