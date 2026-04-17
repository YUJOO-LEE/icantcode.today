# Testing Expansion Roadmap

Living document that tracks the multi-session effort to extend the test
surface beyond unit + integration tests. Update after each commit so the
next session can resume mid-stream.

## Status snapshot

| Track | State | Owner | Notes |
|-------|-------|-------|-------|
| Unit + integration coverage | ✅ done | — | 205 tests, 99.18% lines, thresholds enforced |
| MSW presets | ✅ done | — | `src/tests/mocks/presets.ts` |
| Pre-push hook | ✅ done | — | `.githooks/pre-push` runs `npm run test:run` |
| GitHub Actions test gate | ✅ done | — | `deploy.yml` → test job → build → deploy |
| **Playwright E2E** | ✅ done | Claude | 8 flows passing, CI wired |
| **ESLint gate** | ✅ done | Claude | Flat config, lint clean, pre-push + CI wired |
| **Visual regression** | 🟡 in progress | Claude | Phase 3 of 3; local Playwright screenshots |

## Order of operations

1. **Playwright E2E** — most self-contained, lives in `e2e/` without
   touching existing source code. Delivers immediate value against the
   eight user flows already enumerated in `.claude/agents/qa.md`.
2. **ESLint** — introduces a config plus a potentially long list of
   cleanups in existing source. Done after Playwright so Playwright
   specs come in under the new lint rules too.
3. **Visual regression** — layers on top of Playwright using
   `expect(page).toHaveScreenshot()` for a handful of golden pages.

## Phase 1 — Playwright E2E

### Goal
Exercise the eight core flows enumerated in qa.md directly in a browser
via `@playwright/test`. The tests run against a Vite preview of the
production build so they reflect what actually ships.

### Tasks
- [x] Install `@playwright/test@1.59.1` (pinned, devDep).
- [x] Install Chromium browser only (`npx playwright install chromium`).
- [x] Scaffold `playwright.config.ts` at project root (webServer via vite preview on 4173, ko-KR locale, chromium project).
- [x] Add scripts: `"e2e": "playwright test"`, `"e2e:ui": "playwright test --ui"`.
- [x] `.gitignore`: `/test-results/`, `/playwright-report/`, `/playwright/.cache/`.
- [x] Write one spec per flow (`e2e/*.spec.ts`): all 8 flows implemented, 8/8 passing.
- [x] API layer stubbed via `page.route()` in `e2e/helpers/api.ts`. MSW-in-browser skipped to keep prod bundle clean.
- [x] CI job `e2e` in `.github/workflows/deploy.yml`: depends on `test`, caches `~/.cache/ms-playwright`, uploads `playwright-report/` on failure, gates `build` + `deploy`.
- [x] Committed in slices: `cac73ed` (install+config), `185ecf8` (specs), CI commit to follow.

### Acceptance
- `npm run e2e` passes locally against `npm run preview`.
- CI run for a PR shows the e2e job.
- On failure, the HTML report is uploaded as an artifact.

## Phase 2 — ESLint gate

### Goal
Introduce a modern flat-config ESLint that catches bugs (unused vars,
dead imports, missing hooks deps, JSX a11y issues) before CI. Add to
pre-push + CI so regressions fail fast.

### Tasks
- [x] Install devDeps: eslint 9, @eslint/js 9, typescript-eslint 8, eslint-plugin-react 7, eslint-plugin-react-hooks 5, eslint-plugin-jsx-a11y 6, globals 15.
- [x] Create `eslint.config.js` (flat config): JS + TS + React + hooks + jsx-a11y recommended, unused-vars allow underscore prefix, tests allow `any`, scripts/configs ignored.
- [x] Add scripts: `lint`, `lint:fix`.
- [x] Baseline lint produced 4 errors total; fixed with two intentional autoFocus disables (CLI UX) + cleanup of vitest-axe.d.ts.
- [x] Update `.githooks/pre-push` to run `npm run lint` then tests.
- [x] Add a `lint` job in CI; `build` + `deploy` now gated on lint, test, e2e together.
- [x] Committed as a single slice (install + config + cleanups + hook + CI).

### Acceptance
- `npm run lint` exits 0 on master.
- Pre-push runs lint + tests.
- CI shows lint job green.

## Phase 3 — Visual regression (local Playwright)

### Goal
Catch unintended visual drift on the primary views (landing, feed, error
fallback) without paying for Chromatic/Percy. Uses Playwright's built-in
`toHaveScreenshot()` with baseline images committed to git.

### Tasks
- [ ] In `e2e/visual/*.spec.ts`, write snapshot specs for:
  - `landing-ko.png`, `landing-en.png`
  - `feed-down.png`
  - `error-fallback.png`
  - `theme-dark.png`, `theme-light.png`
- [ ] Lock non-determinism:
  - Freeze clock (`page.clock.install({ time: "2026-01-01T00:00:00Z" })` or mock Date).
  - Disable motion (prefers-reduced-motion header or `page.emulateMedia({ reducedMotion: "reduce" })`).
  - Hide cursors that blink (add a test-only CSS flag or set a cookie read by the app).
- [ ] Generate baselines once on main branch:
  - `npx playwright test e2e/visual --update-snapshots`.
- [ ] Commit `.png` baselines to git (under `e2e/visual/__snapshots__`).
- [ ] Add a separate CI job `visual-regression` that runs on PRs, uploads
  diff artifacts on failure, but does not auto-update baselines.
- [ ] Document the baseline refresh procedure (how to intentionally update).

### Acceptance
- Baselines exist and pass locally on two consecutive runs.
- CI surfaces diffs when the UI changes without an explicit baseline update.

## Conventions & tips

- **All progress tracked here.** On each commit, update the relevant
  checkbox in this file so anyone (including a fresh Claude session) can
  resume where this one stopped.
- **One commit per logical slice.** Install + config is one commit; spec
  bundle is another; CI wiring is a third. Avoid mega-commits.
- **No `--no-verify`**. The pre-push gate is the contract.
- **Korean test strings** stay as-is in unit tests; Playwright specs
  should toggle language via the app's own UI (no hard-wired locale).
- **Ask before adding new deps** that aren't listed in this doc. Anything
  here is pre-approved by the user.

## Open questions (resolve before touching)

- Does CI have enough runtime budget for e2e + visual + unit on every PR?
  Current unit run is ~70s under coverage; e2e against a preview should
  add ~30–60s for a small suite.
- Playwright browsers cache: GitHub Actions cache key for
  `~/.cache/ms-playwright` to avoid re-downloading each run.

## Log (append entries as work progresses)

- 2026-04-18 — Doc created. Starting Phase 1: Playwright install and config.
