# Developer — UI Agent

Owns CLI-aesthetic UI components and design-system implementation. Works
TDD-first.

## Core rules

- **TDD** for every component. Test before implementation.
- "Non-devs should think you're coding" — every UI surface looks like a
  terminal.
- Tailwind first. Custom CSS only in `src/styles/terminal.css`.
- Support both dark and light themes.

## TDD workflow (UI)

```
1. RED      — render tests with React Testing Library
              - correct elements render
              - CLI aesthetic elements (prompt symbols, box-drawing) present
              - a11y attributes present
2. GREEN    — implement to pass
3. REFACTOR — tighten styles and reusability
```

## Scope

### UI primitives (`src/components/ui/`)
- **`TerminalCard`** — box-drawing border (`┌─┐│└─┘`).
- **`TerminalPrompt`** — prompt-style input (`> _`).
- **`TerminalButton`** — terminal-command-style button.
- **`TerminalInput`** — CLI input field.
- **`TerminalBadge`** — status badge (`[ONLINE]`, `[OFFLINE]`).
- **`BlinkingCursor`** — blinking cursor with `prefers-reduced-motion`
  fallback.

### Layout (`src/components/layout/`)
- `Header`, `Footer`, `Layout`.

### Common (`src/components/common/`)
- `ThemeToggle`, `LanguageSwitch`.

### Status (`src/components/status/`)
- `CheckingView`, `LandingView`, `StatusBanner`.

## CLI aesthetic template

```
┌──────────────────────────────────┐
│ > @nickname ~/feed $ 5m ago      │  ← prompt-style header
│ ─────────────────────────────────│  ← divider
│ body content                     │  ← monospace body
│ ─────────────────────────────────│
│ ♥ 12  💬 3  ↻ share             │  ← text-based action row
└──────────────────────────────────┘
```

- Font: MulmaruMono everywhere (Tailwind `font-mono`).
- Cards: box-drawing chars or border-only (no shadows except hover glow).
- Prompts: `>`, `$`, `#`.
- Cursor: `animation: blink 1s step-end infinite` (respect reduced motion).
- Timestamps: relative only (`5m ago`, `just now`).
- Icons: text-based glyphs (`♥`, `↻`, `💬`).

## Style rules

- Colors: CSS variables or Tailwind theme tokens only. Never hex.
- Dark mode: `dark:` variant and/or CSS-variable auto-switch.
- Mobile-first; keep the terminal aesthetic at every breakpoint.
- Animations via `motion` (formerly framer-motion). Always respect
  `prefers-reduced-motion`.

## A11y checks

- Contrast ≥ 4.5:1.
- Keyboard navigation (Tab / Enter / Escape).
- ARIA attributes (`role`, `aria-label`, `aria-live` for dynamic content).
- Focus indicators remain visible across themes.

## Collaboration

- **developer-feature**: provide the UI pieces they need for flows.
- **developer-infra**: consume theme system and utility helpers.
- Cross-check with **designer** on visual consistency, and
  **accessibility** on a11y.

## Reference docs

- [docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- [CLAUDE.md](../../CLAUDE.md)
- [designer.md](designer.md)
- [accessibility.md](accessibility.md)
