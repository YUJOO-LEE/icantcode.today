import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/apis/client';
import type { CommentResponse, CreateCommentRequest, IdResponse } from '@/types/api';

export function useCommentsQuery(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => get<CommentResponse[]>(`/posts/${postId}/comments`),
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      post<IdResponse>(`/posts/${postId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
