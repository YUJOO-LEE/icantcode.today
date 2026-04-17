import type { Page, Route } from '@playwright/test';

/**
 * Build-time Vite inlines `import.meta.env.VITE_API_BASE_URL` into the bundle.
 * The `.env` in this repo sets it to https://api.icantcode.bubu.dev.
 * We intercept that host in-browser so e2e tests never hit the network.
 */
const API_HOST_GLOB = 'https://api.icantcode.bubu.dev/**';

export interface StubOptions {
  status?: 'up' | 'down';
  posts?: Array<{
    id: number;
    content: string;
    author: string;
    commentCount: number;
    createdAt: string;
  }>;
  comments?: Record<
    number,
    Array<{
      id: number;
      postId: number;
      content: string;
      author: string;
      createdAt: string;
    }>
  >;
}

function json(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

/**
 * Install a set of deterministic routes for the entire API surface.
 * Individual specs can override by calling `page.route()` again after this —
 * Playwright applies handlers in registration order, newer first.
 */
export async function stubApi(page: Page, opts: StubOptions = {}): Promise<void> {
  const status = opts.status ?? 'up';
  const posts = opts.posts ?? [];
  const commentsByPost = opts.comments ?? {};

  await page.route(API_HOST_GLOB, async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === '/can-i-code' && method === 'GET') {
      return route.fulfill(
        json({
          canCode: status === 'up',
          checkedAt: new Date().toISOString(),
          statusMessage: status === 'up' ? 'All systems operational' : 'Down',
          models: [
            { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
          ],
        }),
      );
    }

    if (path === '/posts' && method === 'GET') {
      return route.fulfill(json({ list: posts, totalCount: posts.length }));
    }

    if (path === '/posts' && method === 'POST') {
      const body = await route.request().postDataJSON();
      const id = posts.length + 1;
      posts.unshift({
        id,
        content: body.content,
        author: body.author,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      });
      return route.fulfill(json({ id }));
    }

    const commentsMatch = path.match(/^\/posts\/(\d+)\/comments$/);
    if (commentsMatch) {
      const postId = Number(commentsMatch[1]);
      const list = commentsByPost[postId] ?? [];
      if (method === 'GET') return route.fulfill(json(list));
      if (method === 'POST') {
        const body = await route.request().postDataJSON();
        const next = {
          id: list.length + 1,
          postId,
          content: body.content,
          author: body.author,
          createdAt: new Date().toISOString(),
        };
        list.push(next);
        commentsByPost[postId] = list;
        return route.fulfill(json({ id: next.id }));
      }
    }

    return route.fulfill({ status: 404, body: 'Not stubbed' });
  });
}

export function buildPost(
  overrides: Partial<{
    id: number;
    content: string;
    author: string;
    commentCount: number;
    createdAt: string;
  }> = {},
) {
  return {
    id: 1,
    content: 'hello world',
    author: 'alice',
    commentCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
