# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in icantcode.today, please report it privately via GitHub Security Advisories:

https://github.com/YUJOO-LEE/icantcode.today/security/advisories/new

Please do **not** open a public issue for security-related reports.

- **Response target:** within 7 days
- **Scope:** vulnerabilities affecting the live app, build pipeline, or dependencies tracked in `package.json`

## Supported Versions

icantcode.today is a single-page web application with continuous deployment — only the latest build on the `master` branch is maintained. Previous commits are not patched.

| Branch   | Supported |
| -------- | --------- |
| `master` | ✅         |
| others   | ❌         |

## Out of Scope

- Third-party services integrated via public APIs (report to the respective vendor)
- Issues requiring physical access to a user's device
- Attacks relying on outdated browsers or unsupported environments

## Automated Security Layers

This repo enforces security in three layers. All three are required — each covers what the others can't:

| Layer | What it checks | Can it be bypassed? |
|---|---|---|
| **Local pre-push hook** (`.githooks/pre-push`) | typecheck, lint, unit tests | Yes (`git push --no-verify`). Developer ergonomics only — never trust as a gate. |
| **GitHub Actions CI** (`.github/workflows/`) | `audit` (npm audit, high+), `typecheck`, `lint`, `test` (coverage ≥97%), `e2e` (Playwright), `build` (SEO smoke), `CodeQL` (JS/TS static analysis) | No — authoritative gate. |
| **GitHub repository settings** (maintainer configures in UI) | Secret scanning, Push protection, Dependabot, Branch protection | No — set once, enforced always. |

### Repository Settings Checklist (maintainer)

One-time GitHub UI configuration. Re-verify after any org/repo setting change.

**Settings → Code security and analysis**
- [ ] Dependabot alerts: **ON**
- [ ] Dependabot security updates: **ON**
- [ ] Secret scanning: **ON** (default for public repos)
- [ ] **Push protection: ON** (blocks commits containing detected secrets)
- [ ] Private vulnerability reporting: **ON** (enables the advisory link above)

**Settings → Rules → Rulesets** (target: `master`)
- [ ] Restrict deletions
- [ ] Block force pushes
- [ ] Require status checks to pass:
  - `audit`
  - `typecheck`
  - `lint`
  - `test`
  - `e2e`
  - `build`
  - `Analyze (javascript-typescript)` (from CodeQL workflow)

### Vite Bundle Exposure — Important

Any environment variable with the `VITE_` prefix is **inlined into the client bundle as plaintext**. Since this repository is public, `VITE_*` values are effectively public the moment they ship.

- **OK in `VITE_*`**: public API base URL, Cloudflare Web Analytics beacon token, public CDN endpoints, read-only SDK keys
- **NEVER in `VITE_*`**: backend admin keys, DB credentials, signing secrets, OAuth client secrets, any Stripe/SendGrid/etc. secret key

If you must pass a true secret into the build pipeline (e.g. for a server-side build step), use a non-`VITE_` variable and reference it only in `scripts/` — Vite will not inline it.
