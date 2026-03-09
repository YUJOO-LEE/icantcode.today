import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import FeedList from '../FeedList';
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

describe('FeedList', () => {
  it('shows empty state when no posts', async () => {
    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/아직 게시글이 없습니다/)).toBeInTheDocument();
    });
  });

  it('renders posts when data exists', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, () => {
        return HttpResponse.json([
          {
            id: 1,
            content: 'Test post content',
            author: 'tester',
            commentCount: 2,
            createdAt: new Date().toISOString(),
          },
        ]);
      }),
    );

    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Test post content')).toBeInTheDocument();
      expect(screen.getByText('tester')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, () => {
        return HttpResponse.error();
      }),
    );

    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/ERR/)).toBeInTheDocument();
    });
  });
});
