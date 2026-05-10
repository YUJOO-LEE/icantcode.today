import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/apis/client';
import type {
  CommentResponse,
  CreateCommentRequest,
  IdResponse,
  PostListResponse,
  PostSummaryResponse,
} from '@/types/api';

type InfinitePostsCache = {
  pages: PostListResponse[];
  pageParams: number[];
};

function bumpCommentCount(
  list: PostSummaryResponse[],
  postId: number,
): PostSummaryResponse[] {
  return list.map((p) =>
    p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
  );
}

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
      // Two cache shapes share the `['posts']` key: the infinite-query cache
      // (`{ pages, pageParams }`) and the polling cache (`PostListResponse`).
      // Branch on shape — `.map` on the wrong one throws inside
      // `setQueriesData` and bubbles back as an onError on the mutation.
      queryClient.setQueriesData<InfinitePostsCache | PostListResponse>(
        { queryKey: ['posts'] },
        (old) => {
          if (!old) return old;
          if ('pages' in old) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                list: bumpCommentCount(page.list, postId),
              })),
            };
          }
          if ('list' in old) {
            return { ...old, list: bumpCommentCount(old.list, postId) };
          }
          return old;
        },
      );
    },
  });
}
