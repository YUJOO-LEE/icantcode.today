import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/apis/client';
import type {
  RankingResponse,
  StartGameResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from '@/types/api';

export const RANKING_QUERY_KEY = ['games', 'ranking'] as const;

const DEFAULT_RANKING_LIMIT = 10;

export function useStartGame() {
  return useMutation({
    mutationFn: () => post<StartGameResponse>('/games/start', {}),
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitScoreRequest) =>
      post<SubmitScoreResponse>('/games/die', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RANKING_QUERY_KEY });
    },
  });
}

export function useRanking(limit: number = DEFAULT_RANKING_LIMIT) {
  return useQuery({
    queryKey: [...RANKING_QUERY_KEY, limit],
    queryFn: () => get<RankingResponse>('/games/ranking', { limit }),
  });
}
