import { http, HttpResponse, delay } from 'msw';
import { API_BASE_URL } from '@/lib/constants';
import type {
  CanICodeResponse,
  PostListResponse,
  PostSummaryResponse,
  CommentResponse,
} from '@/types/api';

/**
 * Reusable handler factories for test scenarios.
 *
 * Usage in a test:
 *   server.use(presets.postsError(), presets.commentsError(1));
 *
 * These return a single http.* handler that can be composed via `server.use`.
 * For factories that take parameters (postId, delayMs), pass them explicitly.
 */

export const presets = {
  // --- /can-i-code -------------------------------------------------
  statusUp: (): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/can-i-code`, () =>
      HttpResponse.json<CanICodeResponse>({
        canCode: true,
        checkedAt: new Date().toISOString(),
        statusMessage: 'OK',
        models: [],
      }),
    ),

  statusDown: (): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/can-i-code`, () =>
      HttpResponse.json<CanICodeResponse>({
        canCode: false,
        checkedAt: new Date().toISOString(),
        statusMessage: 'Down',
        models: [],
      }),
    ),

  statusError: (status = 500): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/can-i-code`, () =>
      new HttpResponse(null, { status }),
    ),

  statusDelayed: (ms: number): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/can-i-code`, async () => {
      await delay(ms);
      return HttpResponse.json<CanICodeResponse>({
        canCode: true,
        checkedAt: new Date().toISOString(),
        statusMessage: 'OK',
        models: [],
      });
    }),

  // --- /posts ------------------------------------------------------
  postsList: (posts: PostSummaryResponse[]): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/posts`, () =>
      HttpResponse.json<PostListResponse>({
        list: posts,
        totalCount: posts.length,
      }),
    ),

  postsError: (status = 500): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/posts`, () => new HttpResponse(null, { status })),

  createPostError: (status = 500): ReturnType<typeof http.post> =>
    http.post(`${API_BASE_URL}/posts`, () => new HttpResponse(null, { status })),

  // --- /posts/:id/comments -----------------------------------------
  commentsList: (
    postId: number | string,
    comments: CommentResponse[],
  ): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/posts/${postId}/comments`, () =>
      HttpResponse.json<CommentResponse[]>(comments),
    ),

  commentsError: (
    postId: number | string,
    status = 500,
  ): ReturnType<typeof http.get> =>
    http.get(`${API_BASE_URL}/posts/${postId}/comments`, () =>
      new HttpResponse(null, { status }),
    ),

  createCommentError: (
    postId: number | string,
    status = 500,
  ): ReturnType<typeof http.post> =>
    http.post(`${API_BASE_URL}/posts/${postId}/comments`, () =>
      new HttpResponse(null, { status }),
    ),
};

/** Minimal factory for building synthetic post fixtures inline. */
export function buildPost(
  overrides: Partial<PostSummaryResponse> = {},
): PostSummaryResponse {
  return {
    id: 1,
    content: 'fixture post',
    author: 'fixture',
    commentCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Minimal factory for building synthetic comment fixtures inline. */
export function buildComment(
  overrides: Partial<CommentResponse> = {},
): CommentResponse {
  return {
    id: 1,
    postId: 1,
    content: 'fixture comment',
    author: 'fixture',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
