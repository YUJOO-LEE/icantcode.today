# ARCHITECTURE — icantcode.today

## 1. Tech stack — decisions and rationale

### 1.1 React + Vite SPA

- A separate backend exists, so SSR/SSG isn't required.
- **SEO/GEO strategy**: static-first explainability. `index.html` is
  enriched with JSON-LD, `hreflang`, a hidden SEO body, `robots.txt`,
  `sitemap.xml`, and `llms.txt` — crawlers and LLMs can understand the
  service without running JS. (Policy shift, 2026-04.)
- Static hosting (GitHub Pages) is enough.
- SPA-fast transitions match the terminal aesthetic.
- Vite's HMR is fast.

Alternatives ruled out:
- Next.js — overkill for a small set of prerendered routes.
- Remix — over-engineered for this scope.
- Astro — great for static content, but the feed is dynamic.

### 1.2 TypeScript strict

- `strict: true` catches runtime errors at compile time.
- Explicit API response types make the contract visible.
- Refactor-safe.
- Good IDE autocomplete.

### 1.3 TanStack Query v5

- Built for server state.
- Built-in caching, background refetch, optimistic updates.
- Native `refetchInterval` — perfect for API status polling.
- `useInfiniteQuery` for pagination.
- DevTools make debugging easy.

**Invariant**: server state → TanStack Query, client state → Zustand.

### 1.4 Zustand v5

- For client state: theme, session, UI flags.
- Minimal boilerplate compared to Redux.
- Great TypeScript support.
- Intuitive state updates without Immer.
- `persist` middleware makes `localStorage` integration trivial.

### 1.5 Tailwind CSS v4

- CSS-variable-driven (makes theme swaps easy).
- Utility classes suit CLI component styling.
- JIT engine strips unused CSS.
- Keeps design tokens consistent.

### 1.6 react-i18next

- De-facto React i18n standard.
- Namespace-split translation files are easy to maintain.
- Language detection + fallback.

### 1.7 React Router v7

- Each route in `PRERENDER_ROUTES` (`src/constants/routes.ts`) is
  statically prerendered to its own `dist/<route>/index.html` via
  `entry-server.tsx`.
- The home page (`/`) uses state-based conditional rendering for the
  landing ↔ feed swap based on `apiStatus`.

### 1.8 motion (formerly framer-motion)

- Suits terminal-style motion (typewriter, cursor blink, page fades).
- Declarative API keeps complex transitions simple.
- `AnimatePresence` handles unmount animation cleanly.

**Package rename (2026-03-08)**: `framer-motion` → `motion`. Only the
import path changed; API is identical.

### 1.9 fetch wrapper (instead of axios)

- No JWT → axios interceptors aren't needed.
- A ~20-line fetch wrapper suffices.
- TanStack Query already owns retry + error handling.
- Saves ~13 KB gzip.
- Native browser API, zero extra deps.

## 2. Full tech stack

| Concern | Tool | Version |
|---|---|---|
| UI framework | React | 19.x |
| Build tool | Vite | 6.x |
| Language | TypeScript | 5.x (strict) |
| Server state | TanStack Query | v5 |
| Client state | Zustand | v5 |
| Styling | Tailwind CSS | v4 |
| i18n | react-i18next | latest |
| Animation | motion (ex-framer-motion) | latest |
| HTTP | fetch wrapper (`src/apis/client.ts`) | — |
| Font | MulmaruMono (self-hosted) | OFL 1.1 |

## 3. Folder structure

```
src/
├── apis/                        # API layer
│   ├── client.ts                # fetch wrapper
│   └── queries/                 # TanStack Query hooks
│       ├── useStatus.ts         # API status polling
│       ├── usePosts.ts          # feed list (infinite)
│       └── useComments.ts       # comments
│
├── components/
│   ├── ui/                      # CLI-style primitives
│   │   ├── TerminalCard.tsx
│   │   ├── TerminalPrompt.tsx
│   │   ├── TerminalInput.tsx
│   │   ├── TerminalButton.tsx
│   │   ├── TerminalBadge.tsx
│   │   ├── Cursor.tsx
│   │   └── TypewriterText.tsx
│   │
│   ├── feed/                    # feed
│   │   ├── FeedList.tsx
│   │   ├── FeedItem.tsx
│   │   └── FeedComposer.tsx
│   │
│   ├── comment/                 # comments
│   │   ├── CommentList.tsx
│   │   ├── CommentItem.tsx
│   │   └── CommentForm.tsx
│   │
│   ├── status/                  # status
│   │   ├── CheckingView.tsx
│   │   ├── LandingView.tsx
│   │   └── StatusBanner.tsx
│   │
│   ├── layout/                  # layout
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   │
│   └── common/                  # shared
│       ├── ThemeToggle.tsx
│       └── LanguageSwitch.tsx
│
├── pages/
│   └── HomePage.tsx             # sole page; renders landing or feed based on apiStatus
│
├── hooks/
│   ├── useDocumentMeta.ts       # sync <title>/meta to apiStatus + lang
│   ├── useIntersectionObserver.ts
│   ├── useNicknameGuard.ts      # state-based prompt visibility (nickname,
│   │                            # userCode, isPromptVisible, requestNickname,
│   │                            # dismissPrompt) — no closure-captured action
│   └── usePromptedSubmit.ts     # cross-cutting "submit, capture nickname
│                                # inline if missing, then mutate" lifecycle.
│                                # Used by FeedComposer and CommentForm.
│
├── stores/
│   ├── themeStore.ts            # theme (persisted)
│   ├── sessionStore.ts          # userCode (UUID) + nickname (memory only)
│   └── statusStore.ts           # API status cache
│
├── styles/
│   ├── globals.css              # reset, global rules, font loading
│   ├── theme.css                # CSS custom properties (color tokens)
│   └── terminal.css             # CLI-specific animations and styles
│
├── lib/
│   ├── i18n.ts                  # react-i18next setup
│   ├── constants.ts             # polling interval, etc.
│   ├── nicknameGenerator.ts     # random nickname suggestions
│   └── utils.ts                 # date formatters, etc.
│
├── constants/
│   └── app.ts                   # APP_NAME, SHORTCUTS
│
├── types/
│   └── api.ts                   # hand-maintained API types
│
├── locales/
│   ├── ko/{common,feed,auth,status}.json
│   └── en/{common,feed,auth,status}.json
│
├── tests/                       # shared test infra (setup, MSW mocks)
├── App.tsx                      # global providers
└── main.tsx                     # entry
```

## 4. State management

### 4.1 Split rule

```
TanStack Query → anything that comes from the server
Zustand        → pure client-side UI state
```

| State | Owner | Example |
|---|---|---|
| Feed list | TanStack Query | server-paginated |
| Post detail | TanStack Query | cached by id |
| API status | TanStack Query | polled every 30 s |
| Dark/light theme | Zustand + localStorage | unrelated to server |
| Session (`userCode` + nickname) | Zustand (memory only) | cleared on refresh |
| Global API-status summary | Zustand | derived from TanStack Query |

### 4.2 Zustand stores

Split into three:
- **`sessionStore`** — anonymous session (memory only, never persisted).
- **`themeStore`** — dark/light toggle (persisted to `localStorage`).
- **`statusStore`** — API status cache.

### 4.3 TanStack Query config

- Global `QueryClient` defines `staleTime`, `gcTime`, `retry`, etc.
- API status polling via `refetchInterval`; paused when tab is hidden.
- Exact numbers in `src/lib/constants.ts`.

## 5. Data flow

### 5.1 Status-driven screen

```
App.tsx
  │
  ├── <QueryClientProvider>
  │     └── <ZustandHydration>
  │           └── <ApiHealthWatcher>   ← 30 s poll, updates statusStore
  │                 │
  │                 ▼
  │           statusStore.apiStatus
  │                 │
  │                 ├── 'normal'   → landing UI (feed not mounted)
  │                 ├── 'down'     → feed UI (readable without nickname)
  │                 └── 'checking' → status-check UI
  │
  └── / (single route)
        └── <Layout><HomePage /></Layout>
            └── HomePage conditional-renders based on apiStatus
```

> No `/feed` route. State-based conditional rendering.

### 5.2 Feed data flow

```
Feed UI (inside HomePage)
  │
  ├── useInfiniteQuery('posts')
  │     │
  │     ├── [cache hit] → render immediately (stale-while-revalidate)
  │     └── [cache miss] → fetch → cache → FeedList renders FeedItems
  │
  └── useMutation (create post)
        │
        ├── Optimistic update (UI first)
        └── On success: queryClient.invalidateQueries
```

### 5.3 Anonymous session + delayed nickname

See [SERVICE_PLAN.md §4.3](SERVICE_PLAN.md).
UI spec: [DESIGN_SYSTEM.md §5](DESIGN_SYSTEM.md).

### 5.4 Inline NicknamePrompt + mutation lifecycle (load-bearing invariants)

When a user submits a post or comment without a nickname, the form swaps to
the inline NicknamePrompt; once the user confirms the nickname, the original
mutation fires automatically. Two non-obvious invariants govern this flow.
Breaking either re-introduces real bugs that have been fixed before.

**Invariant 1 — the form input must stay mounted for the entire prompt lifecycle.**
The composer's `<input>` / `<textarea>` is rendered inside a `<div hidden={isPromptVisible}>`
wrapper rather than being conditionally returned. If we instead unmount it
while the prompt is up, the next render after prompt close re-mounts the
input with `autoFocus`, which steals key events that were originally aimed
at the NicknamePrompt — Enter key-repeat in particular lands on the freshly
mounted input and fires a phantom second `mutate`. Keep the input mounted.

**Invariant 2 — the prompt is dismissed exactly once, when the mutation settles.**
`handlePromptComplete` (the prompt's `onComplete`) only calls `dispatch(mutate)`;
it does NOT call `dismissPrompt` synchronously. The mutation's `onSuccess` /
`onError` is the single place that calls `dismissPrompt`. This prevents a
visible flicker where the form view briefly takes over between confirming the
nickname and the network request resolving — the user sees the prompt
straight through to "post registered + composer closed". On failure, the
same `dismissPrompt` runs and returns the user to the form with the typed
content + an error banner.

This lifecycle is encapsulated in the `usePromptedSubmit` hook
(`src/hooks/usePromptedSubmit.ts`). Both `FeedComposer` and `CommentForm`
consume it, so any change to either invariant must be made in the hook,
not the consumers. Regression coverage lives in:

- `e2e/09-no-double-submit-after-nickname.spec.ts` (real-browser, both
  flows).
- `src/components/feed/__tests__/FeedComposer.test.tsx` and
  `src/components/comment/__tests__/CommentForm.test.tsx` —
  `regression: prompt stays visible for the entire in-flight mutation` and
  `regression: when the … mutation fails after a prompt-driven submit, …`.

## 6. API integration pattern

- fetch wrapper: `src/apis/client.ts`.
- TanStack Query hooks: `src/apis/queries/<resource>.ts`.
- API contract: OpenAPI spec (see `docs/API_SPEC.md`).
- Types: `src/types/api.ts` — **hand-maintained** (no codegen pipeline).
  When the backend contract changes, update by hand.

### 6.1 Cache update gotcha — `['posts']` matches two shapes

A single query-key prefix can match multiple caches with different shapes,
and `setQueriesData` will run the updater against each match. In this repo,
**the `['posts']` prefix matches both the infinite-query cache used by the
feed (`{ pages: PostListResponse[]; pageParams: number[] }`) and the
polling cache used by `usePostsPolling` (`PostListResponse`)**.

If a `setQueriesData` updater assumes only one shape, it throws on the
other. A throw inside a mutation-level `onSuccess` causes react-query to
deliver the result to the call-site `onError` — so a successful POST gets
reported back as a failed mutation, the form stays full of stale content,
and a phantom error banner appears. This was the root cause of the
duplicate-submit bug fixed in `useCreateComment` (commit-history search
term: "useCreateComment cache shape").

Always shape-narrow before mutating the cache. See
[CODE_CONVENTIONS.md §5 (TanStack Query: cache mutations)](CODE_CONVENTIONS.md)
for the required pattern.

## 7. Performance

### 7.1 Code splitting

Lazy-load feed components so they only load during an outage:

```ts
const FeedSection = lazy(() => import('./components/feed/FeedSection'));
```

### 7.2 Polling

- `refetchIntervalInBackground: false` — pause polling when tab is
  hidden.
- On `visibilitychange` return, re-check once immediately.
- When transitioning from outage → normal, consider raising the polling
  interval (e.g., 60 s).

### 7.3 Render

- `FeedItem` wrapped in `React.memo`.
- Infinite scroll uses `IntersectionObserver` (not scroll listeners).
- Virtual scrolling (TanStack Virtual) is a P2 consideration for long
  feeds.

### 7.4 Bundle

Currently `vite.config.ts` ships Vite's default chunking — no custom
`manualChunks`. The only concern so far is the MulmaruMono webfont, which
is addressed via self-hosting + preload (see §7.5). If/when bundle size
becomes a measured problem, consider `manualChunks` for
`react` / `@tanstack/react-query` / `motion`. Don't add complexity without
a measurement first.

### 7.5 Fonts (LCP)

- MulmaruMono is self-hosted at `public/fonts/MulmaruMono.woff2`.
- Preloaded in `index.html` with `crossorigin="anonymous"`.
- Metric-adjusted fallback `@font-face` reduces CLS on swap.
- Details in `docs/DESIGN_SYSTEM.md` §3.

## 8. Environment variables

- `.env.example` lists required variables.
- Current set:
  - `VITE_API_BASE_URL` — backend base URL.
  - `VITE_CF_BEACON_TOKEN` — Cloudflare Web Analytics beacon token
    (public by design).
- Any new `VITE_*` var must be treated as **public** — it ends up inlined
  in the client bundle.

## 9. Deployment

```
GitHub repo
  │
  ├── push → master
  │     │
  │     └── GitHub Actions (.github/workflows/deploy.yml)
  │           ├── audit / typecheck / lint / test / e2e / build
  │           ├── scripts/inject-cf-token.mjs — injects CF beacon token into dist/index.html
  │           └── actions/deploy-pages → GitHub Pages
  │
  ├── DNS: CNAME at public/CNAME → icantcode.today
  │     (Cloudflare proxy in front of Pages for RUM/analytics)
  │
  └── Backend API (separate service, out of scope)
```

## 10. Tech-stack review log

### 2026-03-08 — initial stack audit

Stack matches 2026 industry norms; no anti-trend choices remain.

| Item | Verdict | Rationale |
|---|---|---|
| React 19 + Vite 6 | KEEP | Industry-standard FE combo |
| TypeScript strict | KEEP | TS 6.0 made strict default |
| TanStack Query v5 | KEEP | #1 for server state, overtook SWR |
| Zustand v5 | KEEP | #1 for client state, ~1.5 KB |
| Tailwind CSS v4 | KEEP | Rust engine, 100× faster incremental |
| react-i18next | KEEP | i18n standard, ~3 KB |
| Vitest + RTL + MSW + Playwright | KEEP | Industry-standard test stack; E2E 8 flows + visual regression in CI |
| React Router v7 | **REMOVED** | Only one route; saved ~14 KB |
| framer-motion | **RENAMED** | Now `motion` |
| axios | **REMOVED** | No JWT, fetch wrapper is enough; saved ~13 KB |

Industry notes:
- TypeScript 6.0 (2026-03-17): strict is default now — no impact.
- TypeScript 7.0 (Go compiler): ~10× faster builds — pick up mid-2026.
- TanStack Router is growing — consider it if routing returns.

---

_Last updated: 2026-04-19_
