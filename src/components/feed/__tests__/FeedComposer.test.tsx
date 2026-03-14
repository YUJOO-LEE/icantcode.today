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
});
