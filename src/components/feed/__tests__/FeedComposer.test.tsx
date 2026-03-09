import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/lib/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import FeedComposer from '../FeedComposer';
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

describe('FeedComposer', () => {
  beforeEach(() => {
    useSessionStore.setState({
      userCode: crypto.randomUUID(),
      nickname: null,
    });
  });

  it('shows nickname prompt when focusing without nickname', async () => {
    const user = userEvent.setup();
    render(<FeedComposer />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.click(textarea);

    await waitFor(() => {
      expect(screen.getByText(/닉네임이 필요합니다/)).toBeInTheDocument();
    });
  });

  it('shows compose form when nickname is set', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    render(<FeedComposer />, { wrapper: createWrapper() });

    expect(screen.getByText(/@testuser/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/무슨 일이 있나요/)).toBeInTheDocument();
  });

  it('shows character count', async () => {
    useSessionStore.setState({ nickname: 'testuser' });
    const user = userEvent.setup();
    render(<FeedComposer />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText(/무슨 일이 있나요/);
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('disables post button when content is empty', () => {
    useSessionStore.setState({ nickname: 'testuser' });
    render(<FeedComposer />, { wrapper: createWrapper() });

    const postButton = screen.getByRole('button', { name: /게시/ });
    expect(postButton).toBeDisabled();
  });
});
