import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import i18n from '@/lib/i18n';
import FeedList from '../FeedList';
import { API_BASE_URL } from '@/lib/constants';
import type { ReactNode } from 'react';

beforeAll(() => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
});

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
        return HttpResponse.json({
          list: [
            {
              id: 1,
              content: 'Test post content',
              author: 'tester',
              commentCount: 2,
              createdAt: new Date().toISOString(),
            },
          ],
          totalCount: 1,
        });
      }),
    );

    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Test post content')).toBeInTheDocument();
      expect(screen.getByText('tester')).toBeInTheDocument();
    });
  });

  it('shows EOF when no more pages', async () => {
    server.use(
      http.get(`${API_BASE_URL}/posts`, () => {
        return HttpResponse.json({
          list: [
            {
              id: 1,
              content: 'Only post',
              author: 'user',
              commentCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
          totalCount: 1,
        });
      }),
    );

    render(<FeedList />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('--- EOF ---')).toBeInTheDocument();
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
