import { useMutation } from '@tanstack/react-query';
import { post } from '@/apis/client';
import type {
  StartGameResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from '@/types/api';

export function useStartGame() {
  return useMutation({
    mutationFn: () => post<StartGameResponse>('/games/start', {}),
  });
}

export function useSubmitScore() {
  return useMutation({
    mutationFn: (data: SubmitScoreRequest) =>
      post<SubmitScoreResponse>('/games/die', data),
  });
}
