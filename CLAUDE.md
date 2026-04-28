# icantcode.today — Project Instructions

Authoritative rules for any AI agent working in this repo. Project-local rules
override `~/.claude/CLAUDE.md` on conflict.

## Project summary

SPA that activates only when the Claude Code API is down. Terminal/CLI
aesthetic so the UI looks like a dev console. Anonymous UUID sessions, no
login. Nickname is entered inline only when the user first posts or comments,
and is kept in memory for the session.

Production: https://icantcode.today

## Tech stack (authoritative)

| Concern | Tool | Notes |
|---|---|---|
| Framework | React 19 + Vite 6 | SPA, no SSR |
| Language | TypeScript 5.7 strict | `tsc -b` must pass |
| Server state | TanStack Query v5 | Hooks live in `src/apis/queries/` |
| Client state | Zustand v5 | Stores in `src/stores/` |
| Styling | Tailwind CSS v4 + CSS variables | No inline color hex |
| i18n | react-i18next | Locales: `ko`, `en` |
| Animation | `motion` (formerly framer-motion) | |
| Font | MulmaruMono (self-hosted) | `public/fonts/MulmaruMono.woff2`, OFL 1.1 |
| HTTP | fetch wrapper at `src/apis/client.ts` | No axios |
| Unit test | Vitest + React Testing Library + MSW | |
| A11y test | vitest-axe | |
| E2E | Playwright (Chromium) | `e2e/`, `npm run e2e` |

When adding a dependency, ask the user first — no exceptions.

## Directory contract

```
src/
  apis/           HTTP client, TanStack Query hooks (apis/queries/)
  components/
    ui/           UI primitives (no domain logic)
    feed/         Post feed
    comment/      Comments
    status/       API status, banners, landing, checking
    layout/       App shell, headers
    common/       Shared pieces
  constants/      App-wide constants (APP_NAME, SHORTCUTS)
  hooks/          Custom hooks (useDocumentMeta, useNicknameGuard, ...)
  lib/            i18n setup, helpers
  locales/        i18n JSON (ko, en)
  pages/          Route-level components (currently only HomePage)
  stores/         Zustand stores
  styles/         globals.css, theme.css, terminal.css
  tests/          Shared test setup + MSW mocks
  types/          Shared TS types
scripts/          Build-time scripts (generate-sitemap.mjs, inject-cf-token.mjs, generate-og.mjs)
public/           Static assets served at /
  fonts/          Self-hosted webfont + LICENSE_OFL.txt
  robots.txt, sitemap.xml, llms.txt, og.png, og.svg, site.webmanifest
e2e/              Playwright specs, including visual regression
docs/             Design docs (SERVICE_PLAN, ARCHITECTURE, DESIGN_SYSTEM, API_SPEC, CODE_CONVENTIONS)
```

## TypeScript rules

- `strict: true` is mandatory. `tsc -b` is part of the build gate.
- Do not use `any`. Use `unknown` with a type guard at the boundary.
- Interface names: no `I` prefix. Use `PostProps`, not `IPostProps`.
- Shared types live in `src/types/`. Co-locate component-specific prop types.

## React rules

- Function components with hooks only. No class components.
- Define the `Props` interface at the top of the component file.
- Prefer explicit `children: ReactNode` over `React.FC`.
- Component filenames: `PascalCase.tsx`.

## State management rules

- Server data (API responses): TanStack Query, always.
- Client state (theme, session, UI flags): Zustand.
- Never store server data in Zustand. Never fetch from inside a Zustand store.
- TanStack Query hooks belong in `src/apis/queries/`. One file per resource.

## Styling rules

- Tailwind first. Custom CSS only in `src/styles/terminal.css`.
- No hardcoded hex values in components. Use CSS variables or Tailwind theme tokens.
- Dark mode via Tailwind `dark:` variant, keyed on `<html class="dark">`.

## File placement rules

- UI primitives → `src/components/ui/`
- Feed → `src/components/feed/`
- Comments → `src/components/comment/`
- Status indicators → `src/components/status/`
- Layout → `src/components/layout/`
- Shared → `src/components/common/`
- API hooks → `src/apis/queries/`
- Pages → `src/pages/`
- Custom hooks → `src/hooks/`
- Zustand stores → `src/stores/`
- Build scripts → `scripts/`
- Crawler/SEO static files → `public/` (`robots.txt`, `sitemap.xml`, `llms.txt`, `og.svg`)

## SEO / GEO policy (added 2026-04)

- **Static-first explainability**: `index.html` must explain the service
  without executing JS. Keep the `<div id="seo-root" hidden aria-hidden="true">`
  block factual and aligned with runtime behavior.
- For any SEO/GEO-adjacent work, read `.claude/agents/seo-geo.md` first.
- `src/hooks/useDocumentMeta.ts` syncs `<title>`, meta description, OG tags,
  and `<html lang>` based on `apiStatus` and current language.
- `public/llms.txt` is the LLM-crawler-facing Markdown summary. Update it
  whenever service copy changes.
- The CI build runs an SEO smoke check (`.github/workflows/deploy.yml`).

## CLI aesthetic rules

- All text uses MulmaruMono.
- Card borders use box-drawing characters (`┌─┐│└─┘`).
- Prompts use `>`, `$`, `#`.
- Cursor blink must honor `prefers-reduced-motion`.
- Timestamps are relative (`5m ago`, `just now`), never absolute.

## i18n rules

- All user-facing text goes through i18n keys.
- Namespaces: `common`, `feed`, `auth`, `status`.
- Key naming: camelCase (e.g., `feed.createPost`).
- When adding strings, update both `src/locales/ko/*.json` and `en/*.json`.

## Auth and session

- No signup, no login. On every page load a UUID (`userCode`) is generated
  in memory via `generateUUID()` (wraps `crypto.randomUUID()`) inside
  `src/stores/sessionStore.ts`.
- Refresh = new `userCode` + cleared nickname. Posts from a prior session
  cannot be edited or deleted by the new session.
- Nickname is entered inline the first time the user posts or comments,
  then reused for the rest of the session.
- Neither `userCode` nor the nickname is persisted to localStorage. Memory
  only.

## Nickname policy (never violate)

- **The nickname must never block feed reading.** This is the top invariant.
- Without a nickname, users can still scroll, read, and like posts.
- Only write actions (post, comment) require a nickname.
- The nickname prompt is inline, not a modal.
- No separate feed route. Everything renders on `/` with state-based
  conditional rendering in `HomePage`.

## TDD workflow

Write tests before production code.

1. **RED** — write the failing test.
2. **GREEN** — write the minimum code to pass.
3. **REFACTOR** — clean up while keeping tests green.

Test coverage bar: components, stores, hooks, and API integration all require
tests. MSW is the default API mock layer for unit/integration tests.

## Ralph auto-activation

For complex implementations, multi-file work, or phase-level development,
automatically run in Ralph mode (iterative loop + architect validation). Do
not wait for the user to say "ralph".

## Git conventions

- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`,
  `refactor:`, `test:`, `chore:`, `perf:`, `ci:`).
- **Never push directly to `master`.** Master is protected by a branch
  ruleset that requires 6 CI checks (`audit`, `typecheck`, `lint`, `test`,
  `e2e`, `build`) plus CodeQL `Analyze` via default setup. Direct pushes
  fail with `GH013`. Always branch, push the branch, and open a PR.
- Branch names match the commit type: `feat/…`, `fix/…`, `docs/…`,
  `perf/…`, `chore/…`, `test/…`, `ci/…`.
- **One concern per PR.** Keep code changes and doc-only changes in
  separate PRs unless the docs strictly describe the same diff.
- Never add `Co-Authored-By` lines (global rule).
- Commit only when the user explicitly asks. Push only when the user
  explicitly asks.

## Design tokens

| Token | Value | Usage |
|---|---|---|
| Primary | `#ABC95B` | CTA, success |
| Dark background | `#121519` | Dark mode body |
| Light background | `#F5F5F0` | Light mode body |
| Error / destructive | `#FF6B6B` | Outage banner, `[CRIT]` indicator, `[FAIL]` model |
| Success / normal | `#ABC95B` | Normal API status |
| Warning | `oklch(0.62 0.11 75)` | `[MINOR]` status.claude.com indicator |
| Alert | `oklch(0.62 0.14 50)` | `[MAJOR]` status.claude.com indicator |
| Info | `oklch(0.55 0.12 230)` | `[MAINT]` status.claude.com indicator |

## Reference docs

- [docs/SERVICE_PLAN.md](docs/SERVICE_PLAN.md) — product plan
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — visual system
- [docs/API_SPEC.md](docs/API_SPEC.md) — API contract
- [docs/CODE_CONVENTIONS.md](docs/CODE_CONVENTIONS.md) — code style
- [AGENTS.md](AGENTS.md) — agent operations

## Verification commands

| Goal | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test:run` |
| Coverage | `npm run test:coverage` |
| Lint | `npm run lint` |
| E2E | `npm run e2e` |
| Production build | `npm run build` |
| Dev server | `npm run dev` |

> **Dev mock harness for `/can-i-code`** — append `?mock=<key>` in dev
> to simulate outage / model-fail / statusPage indicator scenarios.
> Available keys and what each simulates: see the JSDoc table at the
> top of `src/lib/mockStatus.ts`. Disabled in production builds.
