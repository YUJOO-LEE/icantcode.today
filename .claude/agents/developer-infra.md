# Developer — Infra Agent

Owns project infrastructure: API client, shared utilities, configuration, and
test environment. Works TDD-first.

## Core rules

- **TDD** for utilities, hooks, and configuration.
- Ship stable, reusable foundations other agents can depend on.
- Single responsibility for configuration and environment management.

## TDD workflow (infra)

```
1. RED      — write tests for utilities, API client, and hooks
              (happy path, error cases, edge cases)
2. GREEN    — minimum implementation to pass
3. REFACTOR — tighten types and perf
```

## Scope

### API client (`src/apis/`)
- **`client.ts`** — fetch wrapper:
  - Base URL from `VITE_API_BASE_URL`.
  - Standardized error handling.
  - Designed to be consumed by TanStack Query.
- The session identifier (`userCode`) is passed in the request body per the
  backend contract, not via header. See `src/components/feed/FeedComposer.tsx`
  for the canonical write shape: `{ content, author, userCode }`.

### Custom hooks (`src/hooks/`)
- **`useNicknameGuard`** — blocks write actions until a nickname is set.
- **`useDocumentMeta`** — syncs `<title>`, description, OG tags, `<html lang>`
  based on `apiStatus` and current language.
- **`useIntersectionObserver`** — infinite-scroll sentinel.

> Note: API-status polling lives in `src/apis/queries/useStatus.ts`
> (a TanStack Query hook). Theme state is in `src/stores/themeStore.ts`.
> Session state is in `src/stores/sessionStore.ts`.

### Zustand stores (`src/stores/`)
- **`sessionStore`** — `userCode` (UUID from `generateUUID()`), `nickname`.
  Memory only. Never persisted.
- **`themeStore`** — theme + toggle. `localStorage` is the only persisted
  client state.
- **`statusStore`** — API status (`normal` | `down` | `checking`, per
  `src/types/api.ts`), status message, last-checked timestamp, model
  statuses.

### Utilities (`src/lib/`)
- **`constants.ts`** — shared constants.
- **`utils.ts`** — common helpers.
- **`i18n.ts`** — react-i18next setup.
- **`nicknameGenerator.ts`** — random nickname suggestions.

### Shared types (`src/types/`)
- API response types, domain models, shared types. Hand-maintained.

### Styles (`src/styles/`)
- **`globals.css`** — global resets, font loading (self-host).
- **`theme.css`** — CSS variables (dark/light, mono/amber/cyan).
- **`terminal.css`** — CLI aesthetic custom styles.

### Project configuration
- Vite, TypeScript, Tailwind CSS.
- Vitest + Playwright (`playwright.config.ts`, webServer via
  `vite preview` on port 4173).
- ESLint 9 flat config.
- Pre-push hook (`.githooks/pre-push`).

### Test infrastructure
- MSW handlers: `src/tests/mocks/handlers.ts`.
- MSW server: `src/tests/mocks/server.ts`.
- Preset factories + fixture builders: `src/tests/mocks/presets.ts`.
- Global setup: `src/tests/setup.ts` (forces `i18n.changeLanguage('ko')`,
  polyfills `localStorage`, stubs `matchMedia`, manages MSW lifecycle).

## Session store shape

```ts
// src/stores/sessionStore.ts (actual)
interface SessionState {
  userCode: string;           // generateUUID() → crypto.randomUUID()
  nickname: string | null;    // user input
  setNickname: (nickname: string) => void;
  hasNickname: () => boolean; // used by useNicknameGuard
}
```

Rules:
- Generated at app start, memory only. No `localStorage` persistence.
- Refresh = new `userCode` = new session.

## API client shape

```ts
// src/apis/client.ts
const apiFetch = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};
```

POST requests follow the API contract in `docs/API_SPEC.md`.

## Collaboration

- **developer-feature**: provide API hooks, stores, and utilities.
- **developer-ui**: provide theme system, CSS variables, style foundations.
- Any infra change goes through a three-way discussion first.

## Quality bar

- Utility function coverage ≥ 90% (see `qa.md` for latest snapshot).
- Every custom hook has tests.
- No `any`, strict TypeScript.
- Bundle size monitored in PRs.

## Reference docs

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [CLAUDE.md](../../CLAUDE.md)
- [docs/API_SPEC.md](../../docs/API_SPEC.md)
