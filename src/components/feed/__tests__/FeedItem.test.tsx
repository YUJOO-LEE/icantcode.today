import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { createTestWrapper } from '@/tests/wrappers';
import FeedItem from '../FeedItem';

function createWrapper() {
  return createTestWrapper({ withI18n: true }).Wrapper;
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

  it('shows comment toggle button with count', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/댓글 3개 보기/)).toBeInTheDocument();
  });

  it('toggles comments on click', async () => {
    const user = userEvent.setup();
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });

    const replyBtn = screen.getByLabelText(/댓글/);
    await user.click(replyBtn);

    expect(screen.getByPlaceholderText(/댓글을 입력/)).toBeInTheDocument();
  });

  it('has aria-label on comment toggle button', () => {
    render(<FeedItem post={mockPost} />, { wrapper: createWrapper() });
    const btn = screen.getByLabelText(/댓글/);
    expect(btn).toBeInTheDocument();
  });
});
