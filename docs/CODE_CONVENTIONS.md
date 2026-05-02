# Code Conventions

Shared "why we write code this way" rules, agreed after three rounds of
discussion between the five developer agents (Architect, Dev-Feature, Dev-UI,
Dev-Infra, QA). Format rules (file layout, naming, CLI aesthetic, i18n, git)
live in `CLAUDE.md`. This file is the **rationale layer**.

## 1. Design philosophy

### Kent Beck's four rules of simple design (in priority order)

1. **Passes the tests** — code that doesn't work has no value.
2. **Reveals intent** — the reader must grasp *why*.
3. **No duplication** — except accidental duplication (see §5).
4. **Fewest elements** — once 1–3 hold, verify nothing else can be cut.

### YAGNI

This is a single-page SPA. We removed React Router. We removed axios. That's
the spirit.

"We might need it later" is not a reason to add code.

## 2. Components and hooks

### When to extract a hook

Extract a hook to its own file only if **at least one** of:

1. **Reused in 2+ places**, or
2. **Complex enough to need its own test** (3+ branches, async flows).

Otherwise keep it inline.

```tsx
// ❌ extracting trivial one-off logic
const useToggle = () => useState(false);

// ✅ inline
const [open, setOpen] = useState(false);
```

> Why: file extraction adds navigation cost. Extract only when the benefit
> exceeds that cost.

### Context API scope

Context is allowed only for **in-component composition** (e.g., compound
components).

- Global client state → Zustand.
- Server state → TanStack Query.

```tsx
// ❌ global state via Context
const ThemeContext = createContext<Theme>(defaultTheme);

// ✅ Zustand store
const useThemeStore = create<ThemeState>((set) => ({ /* … */ }));
```

> Why: Context makes debugging depth-sensitive and causes unnecessary
> re-renders.

## 3. TypeScript

### Forbidden: `enum`. Use `as const` + union.

```ts
// ❌ enum — esbuild/Vite can't tree-shake it
enum Status { Active, Inactive }

// ✅ zero-runtime + full inference
const STATUS = { Active: 'active', Inactive: 'inactive' } as const;
type Status = typeof STATUS[keyof typeof STATUS];
```

> Why: even `const enum` is mishandled by esbuild and grows the bundle.

### No utility-type chains

```ts
// ❌ unreadable type algebra
type Result = Pick<Omit<Partial<Post>, 'id'>, 'title' | 'content'>;

// ✅ explicit interface
interface PostDraft { title: string; content: string; }
```

> Why: if the type is harder to parse than the value, the type is the bug.
> If a reader can't understand it in 3 seconds, create a named interface.

### When to use generics

Write generics only when **the same type is actually reused in 2+ shapes**.
Single-type generics are over-abstraction.

### `as` is for external boundaries only

`as` is allowed **right after parsing external data** (API responses, JSON,
`localStorage`). Internal code should never need it.

```ts
// ❌ assertion inside internal code
const value = store.get('key') as string;

// ✅ guard at the boundary
const value = store.get('key');
if (typeof value !== 'string') throw new Error('Expected string');
```

> Why: `as` bypasses the type system. Restricting it to boundaries reduces
> runtime errors.

## 4. Error handling

### Three layers, each self-contained

Each layer handles its own errors and does **not** re-throw upward.

| Layer | Responsibility | Implementation |
|---|---|---|
| API status | App-wide outage transition | `statusStore` + polling |
| Global | Network errors → toast | `QueryClient.defaultOptions` |
| Component | Data missing → fallback UI | Inline `isError` check |

```tsx
// ❌ handling network error inside component
if (error?.status === 503) showOutageScreen();

// ✅ stick to the component's own layer
if (isError) return <ErrorFallback message={t('feed.loadFailed')} />;
```

> Why: cross-layer error handling scatters responsibility and duplicates
> treatment of the same failure.

### Minimize `try/catch`

TanStack Query captures errors for you, so component-level `try/catch` is
almost never needed. Reserve `try/catch` for **async work outside Query**
(e.g., clipboard, `localStorage`).

> Why: unnecessary `try/catch` swallows errors and hurts debugging.

## 5. TanStack Query: cache mutations

### Prefer `invalidateQueries` first, `setQueriesData` only when worth it

Default to `invalidateQueries` after a successful mutation. It marks
matching queries stale and refetches them — simple, can't be wrong about
shape, and the network cost is usually fine.

Reach for `setQueriesData` only when an immediate optimistic update is
visibly important (e.g. avoiding a flicker on a counter the user just
incremented). The trade-off is that you become responsible for the cache
shape, which is the next pitfall.

### A query-key prefix can match multiple cache shapes

`setQueriesData({ queryKey: ['posts'] }, updater)` runs the updater
against **every** cache whose key starts with `['posts']`. In this repo
that key prefix matches at least:

- `['posts']` — the **infinite-query** cache: `{ pages, pageParams }`.
- `['posts', 'poll']` — the **polling** cache: `PostListResponse`
  (`{ list, totalCount }`).

If the updater does `old?.map(...)` while assuming a flat array, it
crashes against the infinite-query shape. A throw inside a mutation-level
`onSuccess` is reported back to the call-site as `onError` — turning a
successful POST into a phantom failure visible to the user.

```ts
// ❌ assumes only one shape
queryClient.setQueriesData<PostSummaryResponse[]>(
  { queryKey: ['posts'] },
  (old) => old?.map((p) => /* … */),
);

// ✅ shape-narrow with `'pages' in old` / `'list' in old`
queryClient.setQueriesData<InfinitePostsCache | PostListResponse>(
  { queryKey: ['posts'] },
  (old) => {
    if (!old) return old;
    if ('pages' in old) {
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          list: bumpCommentCount(p.list, postId),
        })),
      };
    }
    if ('list' in old) {
      return { ...old, list: bumpCommentCount(old.list, postId) };
    }
    return old;
  },
);
```

If you only need to update one of the matched caches, scope the predicate
(`{ queryKey: ['posts'], exact: true }`) instead of relying on the
updater to be a no-op for the others.

> Why: a generic type passed to `setQueriesData<T>` is a *cast*, not a
> runtime guarantee. The actual `old` value is whatever's in the cache.

### Mutation-level callbacks must not throw

A throw inside the mutation-level `onSuccess`/`onError` (the ones declared
in `useMutation({ onSuccess: … })`) propagates to the per-call
`onError` and surfaces as a "submit failed" UI state — even though the
mutation itself succeeded.

If you need work that *can* fail in the success handler, isolate it:

```ts
onSuccess: () => {
  try {
    riskyCacheTouch();
  } catch (e) {
    console.error('cache update failed', e);
  }
  // never let this layer throw
},
```

> Why: the user-facing failure modes of an HTTP success and a JS
> exception are completely different. Don't conflate them.

## 6. When to abstract

### Accidental duplication

**Don't merge look-alike code from different domains.**

```tsx
// ❌ forced merge of unrelated shapes
function formatEntity(entity: Post | Comment) { /* … */ }

// ✅ let each domain evolve independently
function formatPost(post: Post) { /* … */ }
function formatComment(comment: Comment) { /* … */ }
```

> Why: merging unrelated code couples two domains that should change
> independently.

### When to abstract

Abstract when you observe **the same change pressure actually happen** — not
on the third repetition. If three repetitions change for different reasons,
leave them separate.

### Helpers and utilities

Do not create helpers for a single-use computation. Three similar lines
beat a premature abstraction.

> Why: abstraction saves lines at the cost of dependencies. Dependencies
> are change cost.

## 7. Testing

### No snapshot tests

```tsx
// ❌ brittle, low-signal
expect(tree).toMatchSnapshot();

// ✅ assert behavior
expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
```

> Why: snapshots tell you *what changed*, not *what's wrong*.

### Required vs optional tests

| Required | Optional |
|---|---|
| Business logic (feed CRUD) | Pure visual render |
| Session UUID generation | Pure layout positioning |
| Delayed nickname flow | Static text display |
| API state transition (outage ↔ normal) | |

### Test data: factories

Don't inline fixture objects per test. Use a factory with defaults and
override only what matters.

```ts
// ✅ factory keeps fixtures consistent
const post = createPost({ title: 'test' });
```

> Why: inline fixtures multiply when schema changes. Factories shield you.

### Test behavior, not implementation

Use `getByRole` / `getByText` — test what the user sees. Do not assert on
internal state or specific function calls.

> Why: implementation tests break on every refactor; behavior tests only
> break when behavior changes.

## 8. Performance

### Measure first, optimize second

Don't add optimization code until profiling (React DevTools Profiler or
`console.time`) confirms a bottleneck.

> Why: guess-based optimization adds complexity and misses the real
> hotspot.

### Memoization

| Hook | Use when | Skip when |
|---|---|---|
| `useCallback` | Passing fn as child prop / stabilizing effect deps | Inline event handler |
| `useMemo` | Computation is clearly expensive (sort, filter) | Trivial object literal |
| `React.memo` | Parent re-renders often + child render is heavy | Lightweight leaf component |

```tsx
// ❌ blanket useCallback
const handleClick = useCallback(() => setOpen(true), []);

// ✅ only when passing down
<ChildComponent onToggle={useCallback(() => setOpen(v => !v), [])} />
```

> Why: unnecessary memoization costs memory and hurts readability.

### List keys

Never use array index as a key. Use a server-provided ID or a generated
UUID.

> Why: index keys cause incorrect DOM reuse when order changes.

## 9. Left to developer discretion

We do not write rules for matters of taste:

- Arrow functions vs `function` keyword — both fine, mix freely.
- Comment style — but only **"why" comments** have value. "What" comments
  should be replaced by better names.
- Variable extraction granularity — up to the author's readability call.
- Tailwind class order — auto-sorted by `prettier-plugin-tailwindcss`.

> Why: regulating taste derails code review from substance.
