import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import CommentList from '../CommentList';
import type { ReactNode } from 'react';

import { API_BASE_URL } from '@/lib/constants';

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
});
