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

- `can-i-code` — API status. Powers the outage poll. Returns
  `{ canCode, checkedAt, statusMessage, models, statusPage? }` where
  `statusPage` mirrors `status.claude.com` (Atlassian Statuspage):
  `indicator` (`none` | `minor` | `major` | `critical` | `maintenance`),
  `description`, optional incident `message`, and a `components` array.
  See `src/types/api.ts` for the canonical types.
- `posts` — list / create.
- `posts/:id/comments` — list / create comments on a post.
- `games/start` (POST) — open a minigame session. Returns
  `{ sessionId }` (one-shot, 36-char). Pass it back to `games/die`.
- `games/die` (POST) — submit a final score. Body
  `{ sessionId, nickname, score }` (`score` 0–99999). Returns `{ id }`.
  A `score` of 0 is not submitted by the client.
- `games/ranking` (GET) — leaderboard. Query `limit` (1–100, default 10).
  Returns `{ list: RankingItem[] }`, `RankingItem` =
  `{ rank, nickname, score, playedAt }`, ordered by score desc then
  earliest `playedAt`. Consumed by `useRanking` in `apis/queries/useGames.ts`
  and rendered by `components/game/fall-f/RankingBoard.tsx`. A successful
  `games/die` invalidates the `['games', 'ranking']` query.
- `push/subscribe` (POST) — store a Web Push subscription so the backend can
  notify this device on status changes. Body
  `{ subscription, lang }` where `subscription` is the browser
  `PushSubscription.toJSON()` (`{ endpoint, expirationTime?, keys: { p256dh, auth } }`)
  and `lang` is `ko` | `en` for notification copy. Returns `{ ok }`.
  Consumed by `useSubscribePush` in `apis/queries/usePushSubscription.ts`.
- `push/unsubscribe` (POST) — stop pushing to a removed subscription. Body
  `{ endpoint }`. Returns `{ ok }`. Consumed by `useUnsubscribePush`.

When a new endpoint is added, update both the type file
(`src/types/api.ts`) and this section.

### 3.1 Web Push backend responsibilities

The frontend only registers subscriptions; delivery is entirely backend-side:

- Generate a VAPID key pair once. The **public** key is exposed to the client
  as `VITE_VAPID_PUBLIC_KEY` (gates the opt-in UI — empty key hides it); the
  **private** key never leaves the server.
- Persist subscriptions from `push/subscribe` (dedupe by `endpoint`).
- On a `can-i-code` status transition (down→up or up→down), send a Web Push to
  every stored subscription (e.g. the `web-push` library). Payload JSON the
  service worker understands: `{ title, body, url?, tag?, icon?, badge? }`.
- Prune subscriptions that return `404`/`410` from the push service.

The service worker that receives these lives at `public/sw.js`; it has no fetch
handler or cache by design (push only).
