import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/apis/client';
import { POSTS_PAGE_SIZE } from '@/lib/constants';
import type { PostSummaryResponse, CreatePostRequest, IdResponse } from '@/types/api';

export function usePostsQuery(page: number = 0) {
  return useQuery({
    queryKey: ['posts', page],
    queryFn: () =>
      get<PostSummaryResponse[]>('/posts', { page, size: POSTS_PAGE_SIZE }),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) =>
      post<IdResponse>('/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
