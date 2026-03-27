import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { get, post } from '@/apis/client';
import { POLLING_INTERVAL, POSTS_PAGE_SIZE } from '@/lib/constants';
import type {
  PostListResponse,
  CreatePostRequest,
  IdResponse,
} from '@/types/api';

export function useInfinitePostsQuery() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) =>
      get<PostListResponse>('/posts', {
        page: pageParam,
        size: POSTS_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, p) => sum + p.list.length, 0);
      return loadedCount < lastPage.totalCount ? allPages.length : undefined;
    },
  });
}

export function usePostsPolling(enabled: boolean, initialData?: PostListResponse) {
  const queryClient = useQueryClient();

  const poll = useQuery({
    queryKey: ['posts', 'poll'],
    queryFn: () =>
      get<PostListResponse>('/posts', { page: 0, size: POSTS_PAGE_SIZE }),
    enabled,
    initialData,
    staleTime: POLLING_INTERVAL,
    refetchInterval: enabled ? POLLING_INTERVAL : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!poll.data) return;

    const cached = queryClient.getQueryData<{
      pages: PostListResponse[];
      pageParams: number[];
    }>(['posts']);

    if (!cached) return;

    const existingIds = new Set(
      cached.pages.flatMap((p) => p.list.map((post) => post.id)),
    );
    const newPosts = poll.data.list.filter((p) => !existingIds.has(p.id));

    const firstPage = cached.pages[0];
    if (!firstPage) return;

    if (newPosts.length === 0 && firstPage.totalCount === poll.data.totalCount) return;

    const updatedFirstPage: PostListResponse = {
      list: [...newPosts, ...firstPage.list].slice(0, POSTS_PAGE_SIZE),
      totalCount: poll.data.totalCount,
    };

    queryClient.setQueryData(['posts'], {
      ...cached,
      pages: [updatedFirstPage, ...cached.pages.slice(1)],
    });
  }, [poll.data, queryClient]);

  return poll;
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
