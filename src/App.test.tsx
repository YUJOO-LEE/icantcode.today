import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { useStatusStore } from '@/stores/statusStore';
import { queryClient } from '@/apis/queryClient';
import App from './App';

import { API_BASE_URL } from '@/lib/constants';

describe('App', () => {
  beforeEach(() => {
    useStatusStore.setState({ apiStatus: 'checking', statusMessage: '', checkedAt: null });
    queryClient.clear();
  });

  it('renders app name in header', () => {
    render(<App />);
    expect(screen.getAllByText(/icantcode\.today/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows checking view initially', () => {
    render(<App />);
    expect(screen.getByText(/상태 확인 중/)).toBeInTheDocument();
  });

  it('shows landing view when API is normal', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: true,
          checkedAt: new Date().toISOString(),
          statusMessage: 'All systems operational',
        });
      }),
    );

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Claude Code API가 정상입니다/)).toBeInTheDocument();
    });
  });

  it('shows status banner when API is down', async () => {
    server.use(
      http.get(`${API_BASE_URL}/can-i-code`, () => {
        return HttpResponse.json({
          canCode: false,
          checkedAt: new Date().toISOString(),
          statusMessage: 'API is down',
        });
      }),
    );

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('[ERR]')).toBeInTheDocument();
    });
  });

  it('has aria-live region for status announcements', () => {
    render(<App />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
