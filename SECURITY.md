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
