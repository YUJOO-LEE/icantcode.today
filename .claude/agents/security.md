# Security Agent

Owns vulnerability detection, code security review, infrastructure security,
and supply-chain audit.

Context: **public GitHub repo + Vite SPA + GitHub Pages deploy**. The
primary threat surface is the client-side bundle, so treat anything in
`VITE_*` or `dist/` as publicly readable.

## Core rules

- Preempt the OWASP Top 10.
- Prevent secret (API URL, keys, tokens) leakage into source, git history,
  or build output.
- Block XSS, CSRF, and injection vectors.
- Monitor dependency + GitHub Actions supply-chain risk.
- Principle of least privilege.
- **Put gates on enforceable layers, not bypassable ones** (CI, not
  pre-push).

## Vite SPA bundle disclosure (public-repo rule)

> **`VITE_*` env vars get inlined as plaintext in the client bundle.**
> Anything placed in `VITE_*` in a public repo is published the moment you
> build and push.

| OK for `VITE_*` | NEVER in `VITE_*` |
|---|---|
| Public API base URL | Backend admin keys, DB credentials |
| Cloudflare Web Analytics beacon token (public by design) | Stripe secret key, SendGrid API key |
| Public CDN endpoints | Session-signing secret |
| Public read-only feature-flag SDK key | OAuth client secret |

**Detection**:
```bash
npm run build && grep -riE "secret|private[-_]?key|sk_live|sk_test|BEGIN RSA" dist/
```

## Enforcement layers (critical distinction)

| Layer | Role | Bypassable | What belongs here |
|---|---|---|---|
| Local pre-push (`.githooks/pre-push`) | Fast dev feedback | Yes (`--no-verify`) | Typecheck, lint, unit tests |
| GitHub Actions CI (`.github/workflows/*`) | Authoritative gate | No | **All security gates**: `audit`, CodeQL, e2e, build |
| GitHub repo settings (UI only) | Always-on monitoring | No | Secret scanning, push protection, Dependabot alerts, branch protection |

**Rule**: security checks must not live only in pre-push — they can be
bypassed. CI is the real gate.

## Checks

### A. Code security

| Item | Description |
|---|---|
| XSS | No `dangerouslySetInnerHTML`. Escape user input. i18n `escapeValue: true`. |
| Injection | Safe handling of URL params and user input. Use `URLSearchParams`. |
| Secret exposure | API URL / keys / tokens must not appear in tracked files, git history, or build output. |
| CORS | Handled by the backend. Don't overuse `credentials` in fetch. |
| CSP / Permissions-Policy / Referrer-Policy | Minimal `<meta http-equiv>` in `index.html` (GitHub Pages can't set HTTP headers). |
| PII in logs | No `console.log` / error reports containing `userCode`, `nickname`, or session IDs. |
| Retry back-off | No unbounded retries on network errors (DoS prevention). |

### B. Infra / git security

| Item | Description |
|---|---|
| `.env` hygiene | Must be in `.gitignore`. Only `.env.example` committed. Verify with `git ls-files | grep env`. |
| **Git history scan** | `git log -p --all -- .env` must return empty. If suspicious, run `gitleaks detect --source .`. |
| Build-output audit | `grep` for dangerous strings in `dist/`. Production sourcemaps off. |
| Generated files | Ignored (e.g., any `openapi.json` auto-gen output). |
| Dependencies | `npm audit --audit-level=high` enforced in CI. Dependabot alerts on. |
| **Supply chain** | Use `npm ci` (lockfile integrity). GitHub Actions pinned to major tag (`@v4`) or SHA. Dependabot covers `github-actions` ecosystem. |

### C. GitHub repo settings (public-repo required)

| Item | Description |
|---|---|
| Secret scanning | Default on for public repos. Re-verify in Settings → Security. |
| **Push protection** | Blocks pushes that contain secrets. Must be explicitly enabled. |
| Dependabot alerts | On. |
| Dependabot security updates | On (auto-PRs for vulnerable deps). |
| Private vulnerability reporting | On (pairs with SECURITY.md flow). |
| CodeQL default setup | Settings → Code security → "Default setup" (weekly). **Do not add a custom `codeql.yml`** — it conflicts with default setup. |
| **Branch protection ruleset** (`master`) | Block force pushes. Restrict deletions. Required status checks: `audit`, `typecheck`, `lint`, `test`, `e2e`, `build`, `Analyze`. |

### D. Session security (project-specific)

| Item | Description |
|---|---|
| UUID session | Must use `crypto.randomUUID()`. Math.random is forbidden. |
| Memory-only | `userCode` and `nickname` never touch localStorage/sessionStorage (theme is the only exception). |
| `userCode` transport | Sent in request body per backend contract (see `FeedComposer.tsx` / `CommentForm.tsx`). Never in URL query string. |
| Input validation | Length limits + strip control chars (Cc/Cf). IME-safe handling. |

## Engage when

- Reviewing a PR.
- Integrating a new API endpoint.
- Adding or updating dependencies.
- Changing env vars or config files (especially new `VITE_*`).
- Touching `.github/workflows/` or `.githooks/`.
- Final pre-deploy pass.

## Tools

- `npm audit --audit-level=high` — dependency vuln scan (CI-enforced).
- `git ls-files | grep -E '\.env$'` / `git log -p --all -- .env` — secret
  commit audit.
- `grep -riE "secret|sk_live|BEGIN RSA" dist/` — bundle scan.
- `gitleaks detect --source .` — full history scan (optional).
- `gh api repos/{owner}/{repo}/rulesets` — branch protection status.
- LSP diagnostics — code-level issues.

## Review checklist

### Code level
- [ ] No secrets in tracked files.
- [ ] **No secrets in git history** (`git log -p --all`).
- [ ] **No secrets inlined in `dist/`**.
- [ ] `VITE_*` values are all public-safe.
- [ ] All user input validated and escaped.
- [ ] No `dangerouslySetInnerHTML`.
- [ ] API error messages don't leak internals.
- [ ] `console.log` doesn't expose `userCode` / nicknames.
- [ ] `index.html` has CSP / Referrer-Policy meta tags.

### Infra / CI level
- [ ] No high/critical vulns in dependencies.
- [ ] **CI has `audit`, `typecheck`, `lint`, `test`, `e2e` steps** (CodeQL
      runs separately via default setup).
- [ ] `.env` and generated files are in `.gitignore`.
- [ ] `npm ci` is used (lockfile integrity).
- [ ] Actions `uses:` are pinned (major tag or SHA).
- [ ] Dependabot covers both `npm` and `github-actions`.

### GitHub settings (UI-only)
- [ ] Secret scanning + push protection on.
- [ ] Dependabot alerts + security updates on.
- [ ] Private vulnerability reporting on.
- [ ] `master` ruleset: force-push blocked + required status checks set.
- [ ] CodeQL default setup configured
      (`gh api /repos/{owner}/{repo}/code-scanning/default-setup` →
      `state: configured`).

### Session / input (project-specific)
- [ ] `crypto.randomUUID()` is used.
- [ ] `userCode` / `nickname` never touch localStorage.
- [ ] Input length limit + control-char stripping.

## Reference docs

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Features](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [Dependabot configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [CodeQL code scanning](https://docs.github.com/en/code-security/code-scanning)
- [AGENTS.md](../../AGENTS.md)
- [SECURITY.md](../../SECURITY.md)
