import type { Page, Route } from '@playwright/test';
import { test as baseTest } from '@playwright/test';

/**
 * Build-time Vite inlines `import.meta.env.VITE_API_BASE_URL` into the bundle.
 * The `.env` in this repo sets it to https://api.icantcode.bubu.dev.
 * We intercept that host in-browser so e2e tests never hit the network.
 */
const API_HOST_GLOB = 'https://api.icantcode.bubu.dev/**';

/**
 * Cloudflare Web Analytics RUM beacon is injected into the production
 * bundle by scripts/inject-cf-token.mjs. In a Playwright preview
 * (localhost:4173) it fails CORS against the production origin — noisy
 * and unrelated to what we're testing. Stub it out.
 */
const CLOUDFLARE_BEACON_GLOBS = [
  '**/static.cloudflareinsights.com/**',
  '**/cloudflareinsights.com/**',
];

/** Silence the beacon so it never fires in e2e. */
export async function stubCloudflareBeacon(page: Page): Promise<void> {
  for (const glob of CLOUDFLARE_BEACON_GLOBS) {
    await page.route(glob, (route) => route.fulfill({ status: 204, body: '' }));
  }
}

/**
 * Wrapped `test` that fails a run on any unexpected console error or
 * page error. Import from this module in every spec instead of
 * @playwright/test directly.
 *
 * Allowed messages (e.g. known harmless warnings) can be added to
 * `ALLOWED_CONSOLE_ERRORS` below.
 */
const ALLOWED_CONSOLE_ERRORS: RegExp[] = [];

export const test = baseTest.extend({
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (ALLOWED_CONSOLE_ERRORS.some((r) => r.test(text))) return;
      consoleErrors.push(text);
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    // Always stub the beacon so tests don't have to remember.
    await stubCloudflareBeacon(page);

    await use(page);

    if (testInfo.status === testInfo.expectedStatus) {
      if (pageErrors.length > 0) {
        throw new Error(
          `Page threw ${pageErrors.length} uncaught error(s):\n` +
            pageErrors.map((e) => `  - ${e.message}`).join('\n'),
        );
      }
      if (consoleErrors.length > 0) {
        throw new Error(
          `Browser console logged ${consoleErrors.length} error(s):\n` +
            consoleErrors.map((m) => `  - ${m}`).join('\n'),
        );
      }
    }
  },
});

export { expect } from '@playwright/test';

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
