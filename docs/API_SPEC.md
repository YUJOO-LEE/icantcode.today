# API_SPEC — icantcode.today

## 1. Overview

The Phase 1 backend API is shipped. **Frontend code must not invent
endpoints or payload shapes.** Follow the backend's OpenAPI contract.

### API base URL

Set in the environment:

```env
# .env (not checked in; see .env.example)
VITE_API_BASE_URL=https://api.example.com
```

Production base URL lives in the deployed `.env` and is consumed via
`import.meta.env.VITE_API_BASE_URL` inside `src/apis/client.ts`.

### OpenAPI docs

The backend exposes Swagger UI. Ask the backend owner (or check internal
docs) for the current URL. The project does **not** currently have a
codegen pipeline wired up — `src/types/api.ts` is hand-maintained to match
the spec.

## 2. Frontend integration rules

### 2.1 Don't invent endpoints

- Never guess an endpoint URL or field name.
- Implement exactly what the OpenAPI spec says.
- If the spec is ambiguous, stop and ask the backend owner — do not
  fabricate.

### 2.2 Auth

Anonymous session. The session ID is a UUID kept in memory only. See
[SERVICE_PLAN.md §4.3](SERVICE_PLAN.md) for the full flow.

- Generate via `crypto.randomUUID()` in `src/stores/sessionStore.ts`.
- Send the session ID as whatever header the backend contract specifies
  (check the Swagger UI).
- Never persist the session ID or nickname to `localStorage` or
  `sessionStorage`. Memory only.

### 2.3 Where to put the code

- fetch wrapper: `src/apis/client.ts` (reads
  `import.meta.env.VITE_API_BASE_URL`).
- Query/mutation hooks: `src/apis/queries/<resource>.ts`.
- Request/response types: `src/types/api.ts`.

### 2.4 Error handling

- The fetch wrapper throws on non-2xx.
- TanStack Query surfaces that via `error` state. Consume it at the
  component layer.
- Never swallow errors silently. Never log `userCode`/`nickname`.

## 3. Known endpoints (hand-maintained summary)

The authoritative source is the OpenAPI spec. This section is a quick
reference and may drift — cross-check before implementing.

- `can-i-code` — API status. Powers the outage poll.
- `posts` — list / create.
- `posts/:id/comments` — list / create comments on a post.

When a new endpoint is added, update both the type file
(`src/types/api.ts`) and this section.

---

_Last updated: 2026-04-19_
