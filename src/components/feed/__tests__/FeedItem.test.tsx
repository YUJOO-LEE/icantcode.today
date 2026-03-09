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
  it('renders post content and author', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    expect(screen.getByText('Test post')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('shows comment count', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    expect(screen.getByText(/💬 3/)).toBeInTheDocument();
  });

  it('toggles comments on click', async () => {
    const user = userEvent.setup();
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });

    const commentBtn = screen.getByText(/💬 3/);
    await user.click(commentBtn);

    // Comments section should now be visible
    expect(screen.getByPlaceholderText(/댓글을 입력/)).toBeInTheDocument();
  });
});
