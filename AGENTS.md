# icantcode.today — Agent Operations

How the 10 specialized agents in `.claude/agents/` divide work on this repo.
`CLAUDE.md` defines the code rules; this file defines who owns what.

## Project summary

SPA community that activates only during Claude Code API outages. Anonymous
UUID sessions, delayed nickname entry (only required to post), single route,
state-driven rendering. Stack: React 19 + Vite 6 + TypeScript + TanStack
Query + Zustand + Tailwind + Playwright.

## Methodology — TDD

Every change follows Red → Green → Refactor.

1. **RED** — write a failing test first.
2. **GREEN** — write the minimum code to make it pass.
3. **REFACTOR** — clean up while keeping the test green.

Before coding, ensure a failing test exists. If it's hard to test, the design
is probably wrong.

## Agent roster

Each agent definition lives in `.claude/agents/<name>.md`. Read that file
whenever you act as or on behalf of an agent.

### architect — `.claude/agents/architect.md`
- **Mandate**: architectural oversight, code-structure review, perf tuning.
- **Core rule**: TanStack Query = server state, Zustand = client state. No
  server data in Zustand, ever.
- **Tools**: LSP, AST grep, directory diagnostics.
- **Engage when**: new feature design, structural PRs, perf regressions,
  dependency decisions.

### developer-feature — `.claude/agents/developer-feature.md`
- **Mandate**: business logic, feature implementation, session management,
  API integration.
- **Core rule**: TDD, strict TypeScript, API access only via TanStack Query
  hooks in `src/apis/queries/`.
- **Owns**: feed CRUD, comments, reactions, anonymous session lifecycle
  (`userCode` = UUID, nickname).

### developer-ui — `.claude/agents/developer-ui.md`
- **Mandate**: CLI-aesthetic UI components, design-system implementation.
- **Core rule**: TDD, Tailwind-first, "non-devs think it's code".
- **Owns**: `TerminalCard`, `TerminalPrompt`, layout, theme toggle, status
  indicators.

### developer-infra — `.claude/agents/developer-infra.md`
- **Mandate**: API client, common utilities, configuration, test infra.
- **Core rule**: TDD, stable foundations, full type safety.
- **Owns**: fetch wrapper, custom hooks, Zustand stores, i18n, MSW setup,
  Playwright config.

### accessibility — `.claude/agents/accessibility.md`
- **Mandate**: WCAG 2.1 AA compliance, keyboard navigation, screen-reader
  support.
- **Core rule**: 4.5:1 contrast minimum; all flows keyboard-operable;
  honor `prefers-reduced-motion`.
- **Engage when**: reviewing UI components, theme changes, animations.
- **Authority**: can block a release for a11y regressions.

### designer — `.claude/agents/designer.md`
- **Mandate**: CLI aesthetic, visual consistency, responsive layout.
- **Core rule**: every pixel looks like a terminal.
- **Engage when**: new component, theme work, layout change.

### planner — `.claude/agents/planner.md`
- **Mandate**: feature prioritization, user stories, sprint planning.
- **Core rule**: P0 → P1 → P2 order is strict.
- **Engage when**: new feature request, roadmap change, sprint planning.

### security — `.claude/agents/security.md`
- **Mandate**: vulnerability detection, code security review, secret
  exposure prevention.
- **Core rule**: OWASP Top 10, least privilege, validate inputs at
  boundaries.
- **Engage when**: PR review, API integration, dependency changes, env-var
  changes, pre-deploy.

### qa — `.claude/agents/qa.md`
- **Mandate**: test strategy, quality assurance, E2E coverage.
- **Core stack**: Vitest + RTL + MSW + Playwright. State-transition tests
  are mandatory.
- **Engage when**: post-feature QA, PR review, pre-release.

### seo-geo — `.claude/agents/seo-geo.md`
- **Mandate**: search-engine optimization plus LLM-crawler adaptation
  (GPTBot, ClaudeBot, PerplexityBot).
- **Core rule**: static-first explainability — `index.html` must explain
  the service without JS.
- **Owns**: static meta (title/og/twitter/hreflang), JSON-LD, `robots.txt`,
  `sitemap.xml`, `llms.txt`, `useDocumentMeta` hook spec.
- **Engage when**: tagline change, new URL, OG asset refresh, meta CI gate.

## Collaboration protocols

### Feature development flow
1. **planner** — requirements and priority.
2. **architect** — tech design, component structure.
3. **designer** — CLI-aesthetic spec.
4. **developer trio** (feature, ui, infra) — three-way design discussion,
   then parallel TDD implementation:
   - `infra`: types, API hooks, utilities (test first)
   - `feature`: business logic (test first)
   - `ui`: components (test first)
5. **accessibility** — a11y audit.
6. **qa** — integration + E2E.

### Bug-fix flow
1. `qa` reproduces and diagnoses.
2. The owning developer adds a regression test, then fixes (TDD).
3. `qa` runs regression suite.

### Design-change flow
1. `designer` produces the spec.
2. `accessibility` reviews for contrast, focus, motion.
3. `developer-ui` implements (test first).
4. `designer` reviews the visual result.

## Roadmap snapshot

### Phase 1 — MVP (shipped)
- [x] Project scaffold (Vite + React + TypeScript)
- [x] Anonymous UUID session + delayed nickname entry
- [x] API status polling (30s)
- [x] State-driven screen transitions (normal → landing, down → feed)
- [x] Feed CRUD (read without nickname)
- [x] Inline nickname prompt on first write action
- [x] Comments

### Phase 2
- [ ] Infinite feed scroll

### Phase 3
- [x] Dark / light mode
- [x] i18n (ko / en)

### Phase 4
- [ ] User profile
- [ ] Notifications
- [ ] Post edit / delete within current session
- [ ] Reactions

## Key architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| SPA vs SSR | SPA (React + Vite) | No own backend, SSR not required |
| Server state | TanStack Query v5 | Polling, caching, infinite scroll |
| Client state | Zustand v5 | Minimal boilerplate (~1.5 KB) |
| Styling | Tailwind CSS v4 | CLI theme customization, dark mode |
| Font | MulmaruMono | Core of the CLI aesthetic |
| Auth | UUID anonymous session | No PII, refresh = new session |
| Methodology | TDD | Red-Green-Refactor, triad design review |

## Runtime facts

- **API base URL**: configured via `VITE_API_BASE_URL` env var (see `.env`).
- **Types (`src/types/api.ts`)**: hand-maintained. No generator is wired up.
  If a codegen pipeline is added later, document the command here.
- **E2E server**: Playwright boots `vite preview` on port 4173
  (`playwright.config.ts`).
- **CI pipeline**: `.github/workflows/deploy.yml` runs typecheck, lint,
  unit + coverage, E2E, build + SEO smoke, then deploy.
