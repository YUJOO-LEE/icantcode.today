import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { presets } from '@/tests/mocks/presets';
import { createTestWrapper } from '@/tests/wrappers';
import { useSessionStore } from '@/stores/sessionStore';
import CommentList from '../CommentList';

import { API_BASE_URL } from '@/lib/constants';

function createWrapper() {
  return createTestWrapper({ withI18n: true }).Wrapper;
}

describe('CommentList', () => {
  beforeEach(() => {
    useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });
  });

  it('shows empty state when no comments', async () => {
    render(<CommentList postId={1} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/아직 댓글이 없습니다/)).toBeInTheDocument();
    });
  });

  it('renders comments when data exists', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts/1/comments`, () => {
        return HttpResponse.json([
          {
            id: 1,
            postId: 1,
            content: 'Great post!',
            author: 'commenter',
            createdAt: new Date().toISOString(),
          },
        ]);
      }),
    );

    render(<CommentList postId={1} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Great post!')).toBeInTheDocument();
      expect(screen.getByText('commenter')).toBeInTheDocument();
    });
  });

  it('shows comment form', async () => {
    render(<CommentList postId={1} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/댓글을 입력/)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    server.use(presets.commentsError(1));

    render(<CommentList postId={1} />, { wrapper: createWrapper() });
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('[ERR]');
      expect(alert).toHaveTextContent(/게시글을 불러오지 못했습니다/);
    });
  });
});
