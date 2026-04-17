# Visual regression tests

These specs use Playwright's `expect(page).toHaveScreenshot()` to catch
unintended UI drift. Screenshots are committed under
`e2e/__snapshots__/visual/` (shared across macOS and Linux via
`snapshotPathTemplate` in `playwright.config.ts`).

## Run locally

```bash
npm run build
npm run e2e              # runs functional + visual
npm run e2e -- e2e/visual  # visual only
```

## Updating baselines (intentional UI change)

1. Review the diff images Playwright produces on failure (`playwright-report/`).
2. If the change is intentional, regenerate:

   ```bash
   npx playwright test e2e/visual --update-snapshots
   ```
3. Commit the updated `e2e/__snapshots__/**` files alongside the code change.
   Treat a baseline update like any other code review — include the PNGs
   in the PR so reviewers can eyeball the new look.

## Determinism hooks

Specs start with:

- `page.emulateMedia({ reducedMotion: 'reduce' })` — disables the cursor
  blink CSS animation and reduces motion/react transitions.
- `page.addInitScript` that freezes `Date.now()` to a fixed timestamp so
  relative-time strings ("just now", "X minutes ago") don't drift.
- API stubbed via `stubApi()` (no network).

Tolerance is set to `maxDiffPixelRatio: 0.03` to absorb font/AA
differences between macOS and Linux. If a real drift slips under this
threshold and you want a tighter lock, tune per-test via the second arg
of `toHaveScreenshot('name.png', { maxDiffPixelRatio: 0.005 })`.

## CI

The existing `e2e` job in `.github/workflows/deploy.yml` already runs
these specs as part of `npm run e2e`. On failure the Playwright HTML
report (including the diff images) is uploaded as an artifact named
`playwright-report`.
