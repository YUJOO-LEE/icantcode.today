import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestWrapper } from '@/tests/wrappers';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import type { RankingItem } from '@/types/api';
import RankingBoard from '../RankingBoard';

function renderBoard() {
  const { Wrapper } = createTestWrapper({ withI18n: true });
  return render(<RankingBoard />, { wrapper: Wrapper });
}

function rankingResponse(list: RankingItem[]) {
  return HttpResponse.json({ list });
}

const SAMPLE: RankingItem[] = [
  { rank: 1, nickname: 'koder-one', score: 9999, playedAt: '2026-05-01T00:00:00Z' },
  { rank: 2, nickname: 'koder-two', score: 8000, playedAt: '2026-05-02T00:00:00Z' },
  { rank: 3, nickname: 'koder-three', score: 1200, playedAt: '2026-05-03T00:00:00Z' },
];

describe('RankingBoard', () => {
  it('renders the leaderboard header', async () => {
    server.use(http.get(`${API_BASE_URL}/games/ranking`, () => rankingResponse(SAMPLE)));
    renderBoard();
    expect(await screen.findByText(/leaderboard/)).toBeInTheDocument();
  });

  it('renders one row per ranking entry with rank, nickname and score', async () => {
    server.use(http.get(`${API_BASE_URL}/games/ranking`, () => rankingResponse(SAMPLE)));
    renderBoard();

    await waitFor(() => {
      expect(screen.getByText('koder-one')).toBeInTheDocument();
    });
    expect(screen.getByText('koder-two')).toBeInTheDocument();
    expect(screen.getByText('koder-three')).toBeInTheDocument();
    expect(screen.getByText('9999')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('passes the requested limit to the API', async () => {
    let capturedLimit: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/games/ranking`, ({ request }) => {
        capturedLimit = new URL(request.url).searchParams.get('limit');
        return rankingResponse(SAMPLE);
      }),
    );
    const { Wrapper } = createTestWrapper({ withI18n: true });
    render(<RankingBoard limit={3} />, { wrapper: Wrapper });
    await waitFor(() => expect(capturedLimit).toBe('3'));
  });

  it('shows the empty-state line when there are no scores', async () => {
    server.use(http.get(`${API_BASE_URL}/games/ranking`, () => rankingResponse([])));
    renderBoard();
    expect(await screen.findByText(/아직 기록이 없어요/)).toBeInTheDocument();
  });

  it('shows the error line when the request fails', async () => {
    server.use(http.get(`${API_BASE_URL}/games/ranking`, () => HttpResponse.error()));
    renderBoard();
    expect(await screen.findByText(/랭킹을 불러올 수 없어요/)).toBeInTheDocument();
  });

  it('shows a loading status while the request is in flight', () => {
    server.use(
      http.get(`${API_BASE_URL}/games/ranking`, async () => {
        await new Promise((r) => setTimeout(r, 50));
        return rankingResponse(SAMPLE);
      }),
    );
    renderBoard();
    expect(screen.getByRole('status')).toHaveTextContent(/불러오는 중/);
  });
});
