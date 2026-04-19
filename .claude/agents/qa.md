# QA Agent

Owns test strategy, quality assurance, coverage, and E2E.

## Core rules

- No merge without test coverage.
- State-transition tests are mandatory.
- Dark/light and i18n switches must be covered.
- **The pre-push hook (`.githooks/pre-push`) runs the full test suite before
  every push.** Failures block the push. Bypass only with `--no-verify`
  (emergencies only).
- New tests follow the `__tests__/` subfolder convention:
  `src/**/__tests__/*.{test,spec}.{ts,tsx}`.

## Tooling

| Tool | Purpose |
|---|---|
| Vitest 3 | Unit test runner (`vitest run` / `npm run test:run`) |
| React Testing Library | Component tests |
| user-event v14 | User-interaction simulation |
| MSW v2 (`msw/node`) | API mocking in Node |
| vitest-axe | Automated a11y checks (axe-core based) |
| jsdom 26 | DOM environment (`environment: 'jsdom'`) |
| Playwright v1.59 | E2E (Chromium, `e2e/`, `npm run e2e`) |

## Test infrastructure notes

### `src/tests/setup.ts` — global setup
- **Force i18n to Korean**: jsdom sets `navigator.language=en-US`, which
  makes i18n initialize to `en` and breaks Korean-text assertions. Fix:
  `void i18n.changeLanguage('ko')` globally and in `afterEach`.
- **localStorage polyfill**: jsdom 26 exposes `window.localStorage` but its
  methods are detached from the prototype, so `zustand/persist` fails with
  `storage.setItem is not a function`. Replace with a `MemoryStorage` class.
- **matchMedia stub**: not supported in jsdom; stub with `vi.fn()`.
- **MSW lifecycle**: `beforeAll(server.listen)` / `afterEach(resetHandlers)`
  / `afterAll(server.close)`.

### `src/tests/mocks/` — MSW mocks
- `server.ts` exports `setupServer(...handlers)`.
- `handlers.ts` holds default handlers (`can-i-code`, posts, comments).
  Override per test with `server.use(http.get(..., …))`.

### Test wrapper pattern
Components that need both i18n and TanStack Query should use a local
wrapper:

```ts
function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}
```

## Test strategy

### Unit
- Utility functions and custom hooks.
- Zustand store logic.
- UUID session generation/management.
- Type guards.

### Component
- Rendering (happy, loading, error, empty).
- User interactions (click, input, keyboard).
- Re-render on prop changes.
- Presence of CLI-aesthetic elements.

### Integration
- TanStack Query hooks with MSW.
- Feed data flow: fetch → create → cache invalidation.
- State-driven screen transitions.
- Session-based authorization (only the same session can edit/delete).

### E2E (Playwright)
Core user flows:

1. First load → feed readable immediately (no nickname needed).
2. API normal → landing view (single route, no router split).
3. API down → same page swaps to feed.
4. Click "new post" → inline nickname prompt if unset → post created.
5. Post write after nickname is set — no re-prompt in the same session.
6. Comment creation → appears on the post.
7. Theme toggle → visual change.
8. Language toggle → text change.
9. Refresh → new session; old posts are read-only.

### Mandatory scenarios
- [ ] Route transitions on API status change.
- [ ] Dark ↔ light mode toggle.
- [ ] Korean ↔ English toggle.
- [ ] Feed infinite scroll.
- [ ] Session-based authorization (own posts only).
- [ ] Session reset on refresh.
- [ ] Offline / error state handling.

## MSW preset pattern

- `src/tests/mocks/handlers.ts` — default handlers (all succeed).
- `src/tests/mocks/server.ts` — exposes `setupServer(...handlers)`.
- `src/tests/mocks/presets.ts` — success/error/delay factories +
  `buildPost` / `buildComment` fixture builders.

```ts
import { presets, buildComment } from '@/tests/mocks/presets';

server.use(presets.commentsError(1));
server.use(presets.statusDelayed(500));
server.use(presets.commentsList(1, [buildComment({ content: 'x' })]));
```

Per-test overrides go through `server.use(...)` and reset automatically in
`afterEach`.

## Commands

| Goal | Command |
|---|---|
| Watch mode | `npm test` |
| Single run (CI) | `npm run test:run` |
| Coverage | `npm run test:coverage` (v8 + HTML at `coverage/index.html`) |
| Build verification | `npm run build` (sitemap + `tsc -b` + `vite build`) |
| E2E | `npm run e2e` |
| E2E UI | `npm run e2e:ui` |

Coverage thresholds are enforced in `vitest.config.ts`:
statements 97, branches 92, functions 95, lines 97. Drops below threshold
fail the command.

## CI pipeline

- `.github/workflows/deploy.yml` runs on both `push:master` and
  `pull_request`.
- `test` job runs `npm run test:coverage` first — fails if below threshold.
- `build` depends on `test` — adds SEO smoke + Pages artifact.
- `deploy` job runs on `push:master` only.

Locally, `.githooks/pre-push` runs the same `npm run test:run`. Bypass with
`--no-verify` (emergencies only).

## Coverage targets + current state (2026-04)

| Area | Target | Current |
|---|---|---|
| Utilities (`src/lib/*`) | 90%+ | **100%** |
| Hooks (`src/hooks/*`) | 80%+ | **100%** |
| Stores (`src/stores/*`) | 90%+ | **100%** |
| API layer (`src/apis/*`) | 80%+ | 93–100% |
| UI primitives (`src/components/ui/*`) | 80%+ | **100%** |
| Feature components (feed/comment/status/layout) | 70%+ | 98–100% |
| Pages (`src/pages/*`) | 60%+ | **98.9%** |
| **Overall** | — | **99.18% lines / 94.52% branch / 98.86% functions** |

## Remaining coverage gaps (2026-04 audit, v8)

All high-priority gaps closed. Remainder are small branches or defensive
paths:

- `src/apis/queries/usePosts.ts` 87.5% — `usePostsPolling` cache-merge
  effect (lines 66–74). Only naturally provable via integration tests.
- `src/components/feed/FeedList.tsx` 96.7% — IntersectionObserver callback
  error path (lines 98–100).
- `src/lib/i18n.ts` / `src/lib/constants.ts` — short-circuit branches on
  `??` / `?.startsWith` that both paths hit at runtime but v8 under-counts.

### Future work (separate tracks)
- **Playwright E2E**: shipped — 8 flows + visual regression wired in CI
  (2026-04).
- **Visual regression** (Chromatic / Percy): not adopted yet.
- **Lint gate**: consider adding `eslint` to pre-push.

## Reference docs

- [docs/SERVICE_PLAN.md](../../docs/SERVICE_PLAN.md)
- [CLAUDE.md](../../CLAUDE.md)
- [src/tests/setup.ts](../../src/tests/setup.ts)
- [src/tests/mocks/handlers.ts](../../src/tests/mocks/handlers.ts)
- [.githooks/pre-push](../../.githooks/pre-push)
