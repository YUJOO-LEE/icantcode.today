# Designer Agent — icantcode.today

Owns the CLI-aesthetic design system: visual polish, consistency, layout.

## 1. Core principles

> "Non-developers should think you're coding."

1. **Terminal-first**: render as "text inside a terminal". No window chrome
   (traffic-light dots, title bars).
2. **Function over form**: no decoration without purpose.
3. **Monospace everything**: MulmaruMono only.
4. **Text as UI**: prefer text symbols over icons — `>`, `$`, `#`, `[OK]`,
   `[ERR]`.

## 2. Aesthetic details

### CRT effect (dark mode only)
- Subtle scanlines via `repeating-linear-gradient` in
  `src/styles/terminal.css`.
- Max opacity 0.04 — atmosphere only, never intrusive.
- Disabled when `prefers-reduced-motion` is set.

### Phosphor glow
- Hover state in dark mode uses a soft box-shadow:
  ```css
  box-shadow: 0 0 0 1px rgba(171, 201, 91, 0.15), 0 0 30px rgba(171, 201, 91, 0.06);
  ```

### Visual hierarchy (dark mode)
- Brightness increases: background → surface (card) → border → text.
- Colors defined in `oklch()` space (see `src/styles/theme.css`).

### Motion
- Prefer opacity fades over slides (evokes typing).
- Stagger feed items by 0.08 s.
- Micro-interactions: 0.15–0.20 s.
- Active press: `translateY(1px)`.
- Forbidden: bounce, 3D transforms, background particles, hover scale-up.

## 3. Consistency

### Color tokens
- Every color goes through a CSS variable — no hex in components.
- oklch-based variables in `theme.css`: `--background`, `--foreground`,
  `--card`, `--border`, `--primary`, `--muted`, `--muted-foreground`,
  `--destructive`, etc.
- Three themes supported: `mono` (default), `amber` (retro CRT),
  `cyan` (cyberpunk).

### Spacing
- Between cards: `mb-4`.
- Inside cards: `p-4`.
- Header/footer: `py-2`.
- Only Tailwind scale values. No arbitrary spacing without justification.

### Typography
- Feed body: `text-base`.
- Comments/secondary: `text-sm`.
- Meta/timestamps: `text-xs`.
- Icons: use `▸`, `▾`, `●`, `○` — no emoji for UI affordance.

### Review checklist
- [ ] All spacing uses Tailwind scale.
- [ ] Typography follows the design-system tiers.
- [ ] No hex color literals in component files.
- [ ] Badge style consistent (`text-xs`, bracketed `[TEXT]`).
- [ ] Prompt symbols used consistently.

## 4. Layout

### Page shell
```
<Layout>                      <!-- min-h-screen bg-background font-mono -->
  <Header />                  <!-- border-b, py-2, max-w-3xl -->
  <main>                      <!-- max-w-3xl mx-auto px-4 py-6 -->
    {children}
  </main>
  <Footer />                  <!-- border-t -->
</Layout>
```

### Breakpoints
- `< 640 px` (mobile): single column, tight spacing.
- `>= 640 px` (tablet): standard spacing.
- `>= 1024 px` (desktop): comfortable reading width.
- Current implementation pins to `max-w-3xl` (768 px).

### A11y checks (WCAG 2.1 AA)
- [ ] Every interactive element has `aria-label` or visible text.
- [ ] `<time>` elements carry a `dateTime` attribute.
- [ ] Focus moves appropriately on dynamic content swaps.
- [ ] Status updates use `role="status"` and `aria-live`.
- [ ] Contrast ≥ 4.5:1.

## 5. Current component status

| Component | Today | Phase 2 target |
|---|---|---|
| TerminalCard | CSS `border border-border` | Box-drawing border chars |
| TerminalBadge | `variant` prop, single-color `[TEXT]` | Per-variant background |
| TerminalButton | Borderless text `[TEXT]`, color-shift on hover | Border + padding style |
| TerminalPrompt | `-rw-r--r-- user time #id` (ls -l style) | `> @user ~/feed $` prompt style |
| Header | `username@icantcode.today:~$` (SSH style) | Same |

## Reference files

- `src/styles/theme.css` — oklch color tokens (mono/amber/cyan).
- `src/styles/terminal.css` — CRT scanlines, cursor animation, scrollbar.
- `src/components/ui/` — `TerminalCard`, `TerminalPrompt`, `TerminalButton`,
  `TerminalBadge`, `TerminalInput`.
- [docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md) — full design-system doc.
