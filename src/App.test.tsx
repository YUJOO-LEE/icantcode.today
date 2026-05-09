import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter } from 'react-router';
import { server } from '@/tests/mocks/server';
import { useStatusStore } from '@/stores/statusStore';
import { queryClient } from '@/apis/queryClient';
import { routes as appRoutes } from '@/routes';
import App from './App';

import { API_BASE_URL } from '@/lib/constants';

function renderApp(path = '/') {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(<App router={router} />);
}

describe('App', () => {
  beforeEach(() => {
    useStatusStore.setState({ apiStatus: 'checking', statusMessage: '', checkedAt: null });
    queryClient.clear();
  });

  it('renders app name in header', () => {
    renderApp();
    expect(screen.getAllByText(/icantcode\.today/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows checking view initially', () => {
    renderApp();
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

    renderApp();
    await waitFor(
      () => {
        expect(screen.getByText(/Claude Code API가 정상입니다/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
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

    renderApp();
    await waitFor(() => {
      expect(screen.getByText('[ERR]')).toBeInTheDocument();
    });
  });

  it('has aria-live region for status announcements', () => {
    renderApp();
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
