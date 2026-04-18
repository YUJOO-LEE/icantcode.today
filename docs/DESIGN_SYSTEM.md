# DESIGN_SYSTEM — icantcode.today

## 1. Design philosophy

### "Non-developers looking over your shoulder should think you're coding."

Every UI surface is rooted in CLI aesthetics. To someone who doesn't know a
terminal, the screen should still read as "a developer doing something
professional."

### Core principles

| Principle | Meaning |
|---|---|
| Terminal first | Every component looks like a CLI tool. |
| Function over form | Utility beats decoration. |
| Monospace everything | MulmaruMono only. |
| Text as UI | Prefer text symbols (`>`, `$`, `#`, `[OK]`, `[ERR]`) over icons. |
| Purposeful motion | Typing + cursor blink only. No decorative animation. |

## 2. Color palette

### 2.1 Brand
```
Primary accent  #ABC95B   olive green (logo color)
```

### 2.2 Dark mode (default)
```
Background      #121519   deep dark (terminal background)
Surface         #1E2329   card/panel background
Border          #2D3440   dividers, box-drawing chars
Text primary    #E8E8E8
Text secondary  #8B9299   meta, timestamp
Text muted      #4A5568   disabled
```

### 2.3 Light mode
```
Background      #F5F5F0   off-white (paper feel)
Surface         #EAEAE4
Border          #C8C8C0
Text primary    #2D2D2D
Text secondary  #6B7280
Text muted      #9CA3AF
```

### 2.4 Semantic colors
```
Success / Normal    #ABC95B   API healthy (same as Primary)
Error / Down        #FF6B6B   API outage
Warning / Degraded  #FFD93D   reserved for degraded state (not wired up yet)
Info                #6BB5FF   info banner
```

### 2.5 CSS custom properties (`src/styles/theme.css`)

Uses `oklch()`. Three theme variants: `mono` (default), `amber` (retro
CRT), `cyan` (cyberpunk). Switch via `<html data-terminal="theme-name">`.

```css
/* mono theme, light mode */
:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.20 0 0);
  --card: oklch(0.96 0 0);
  --card-foreground: oklch(0.20 0 0);
  --primary: oklch(0.25 0 0);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.94 0 0);
  --muted: oklch(0.92 0 0);
  --muted-foreground: oklch(0.50 0 0);
  --border: oklch(0.85 0 0);
  --destructive: oklch(0.50 0.18 25);
  --ring: oklch(0.40 0 0);
  --radius: 0;
}

/* mono theme, dark mode */
.dark {
  --background: oklch(0.10 0 0);
  --foreground: oklch(0.85 0 0);
  --card: oklch(0.14 0 0);
  --primary: oklch(0.90 0 0);
  --secondary: oklch(0.20 0 0);
  --muted: oklch(0.18 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --border: oklch(0.28 0 0);
}
```

> The hex values in §2.1–2.4 are design-intent references. Actual
> implementation uses `oklch()`. The authoritative values live in
> `src/styles/theme.css`. `amber` and `cyan` themes follow the same variable
> names.

## 3. Typography

### 3.1 Font family

**MulmaruMono only.** Self-hosted under OFL 1.1 (`public/fonts/LICENSE_OFL.txt`).

```css
/* webfont loading — self-hosted for LCP (2026-04-19) */
@font-face {
    font-family: 'MulmaruMono';
    src: url('/fonts/MulmaruMono.woff2') format('woff2');
    font-weight: normal;
    font-display: swap;
}

/* metric-adjusted fallback to minimize CLS on swap */
@font-face {
    font-family: 'MulmaruMono Fallback';
    src: local('Menlo'), local('Consolas'), local('Courier New');
    font-display: swap;
    size-adjust: 100%;
    ascent-override: 90%;
    descent-override: 25%;
    line-gap-override: 0%;
}

font-family: 'MulmaruMono', 'MulmaruMono Fallback', monospace;
```

Preload in `index.html`:
```html
<link rel="preload" href="/fonts/MulmaruMono.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
```

- Upstream: https://noonnu.cc/font_page/1764
- Original repo: https://github.com/mushsooni/mulmaru
- Author: Mushsooni
- License: SIL Open Font License 1.1
- Never use a non-monospace fallback. The whole service must read as a
  terminal.

### 3.2 Type scale

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 11 px | Timestamps, meta |
| `text-sm` | 13 px | Secondary, labels |
| `text-base` | 15 px | Body, feed content |
| `text-lg` | 18 px | Sub-heading |
| `text-xl` | 22 px | Heading |
| `text-2xl` | 28 px | Page header |
| `text-3xl` | 36 px | Landing hero |

### 3.3 Font weights
```
Regular  (400) → body, feed
Medium   (500) → usernames, labels
Bold     (700) → headers, emphasis
```

### 3.4 Line height

```
Terminal text  line-height: 1.5   (readability + terminal feel)
Code blocks    line-height: 1.6
```

> Current implementation uses Tailwind `leading-relaxed` (1.625) on feed
> body.

## 4. CLI component patterns

### 4.1 Box-drawing characters

Core of the terminal UI.

**Current (Phase 1)**: `TerminalCard` uses CSS `border border-border` — a
clean straight-line border, stable at every viewport.

**Phase 2 plan**: switch to Unicode box-drawing characters for a stronger
terminal feel.

```
┌─────────────────────────┐   top
│ content                 │   sides
├─────────────────────────┤   divider
│ more                    │
└─────────────────────────┘   bottom
```

| Char | Code | Purpose |
|---|---|---|
| `┌` | U+250C | top-left |
| `┐` | U+2510 | top-right |
| `└` | U+2514 | bottom-left |
| `┘` | U+2518 | bottom-right |
| `─` | U+2500 | horizontal |
| `│` | U+2502 | vertical |
| `├` | U+251C | T-branch right |
| `┤` | U+2524 | T-branch left |
| `┼` | U+253C | cross |

### 4.2 Prompt symbols and formats

**Current**: `TerminalPrompt` uses `ls -l` style:

```
-rw-r--r--  username  5m ago  #42
```

- `-rw-r--r--`: decorative permission symbol.
- `username`: author, highlighted via `text-foreground`.
- `5m ago`: relative timestamp.
- `#42`: post/comment id.

**Header**: SSH-session style:
```
username@icantcode.today:~$_
```

Input-field prompts:

| Symbol | Meaning | Usage |
|---|---|---|
| `>` | Generic input prompt | Post compose, comment input |
| `$` | User command | Header session display |

### 4.3 Cursor animation

```css
/* terminal.css */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1em;
  background-color: var(--primary);
  animation: cursor-blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; opacity: 1; }
}
```

### 4.4 Timestamp format

| Elapsed | EN | KO |
|---|---|---|
| < 1 m | `just now` | `방금` |
| < 1 m (with unit) | `< 1m ago` | `방금 전` |
| 1–59 m | `5m ago` | `5분 전` |
| 1–23 h | `3h ago` | `3시간 전` |
| 1–6 d | `2d ago` | `2일 전` |
| ≥ 7 d | absolute date `2026-03-01` | absolute date |

## 5. UI policy per API status

### 5.0 Invariant — no outage, no feed

When the API is healthy the community feed must not render at all: no list,
no compose form, no post count. Nothing feed-related touches the DOM.

| API state | Screen | Feed |
|---|---|---|
| `normal` | "You can code right now. Get back to work!" | **Not mounted** |
| `down` | Outage banner + feed | Visible |
| `checking` | Status-check animation | Hidden |

> `src/types/api.ts` currently defines only three states. A `degraded`
> state is reserved visually (warning color `#FFD93D`) but not implemented
> in code yet.

### Normal-state landing

```
┌──────────────────────────────────────┐
│                                      │
│    $ status --check                  │
│                                      │
│    [OK] Claude Code API is online    │
│                                      │
│    > You can code right now.         │
│    > Get back to work!_              │
│                                      │
│    ──────────────────────────────── │
│    # The feed opens only on outages. │
│                                      │
└──────────────────────────────────────┘
```

### Implementation rules

- Feed components are **conditionally mounted** (not `display: none`).
- No feed prefetch in normal state (avoid needless requests).
- Single route (`/`). No `/feed` path.
- During an outage the feed reads without a nickname.

### Delayed nickname UI

**Invariant: the nickname must never block feed reading.**

Feed is visible immediately on outage; nickname is prompted only on a write
action (post or comment).

#### Unset — compose view

Clicking the compose area swaps to an inline prompt:

```
┌──────────────────────────────────────┐
│ $ set-nickname                       │
│ ──────────────────────────────────── │
│ # You need a nickname to post.       │
│                                      │
│ > Enter nickname: _                  │
│                                      │
│ [  > confirm  ]  [  > cancel  ]      │
└──────────────────────────────────────┘
```

#### Set — compose view

```
┌──────────────────────────────────────┐
│ $ @my_nickname ~/compose             │
│ ──────────────────────────────────── │
│ > What's happening?_                 │
│                                      │
│ [  > post  ]                         │
└──────────────────────────────────────┘
```

#### Header display

SSH-style:

```
set     nickname@icantcode.today:~$_
unset   guest@icantcode.today:~$_
```

#### Implementation rules

- Inline prompt (not a modal). No page transitions.
- On compose focus, check nickname → swap to prompt if unset.
- After setting, return to the compose view automatically.
- Header shows the current nickname; unset → clickable "set" link.

## 6. Feed card spec

### 6.1 Default layout

```
┌──────────────────────────────────────┐
│ > @username ~/feed $ 5m ago          │
│ ──────────────────────────────────── │
│ Claude API is down again...          │
│ Coding and it just stopped.          │
│ Coming here is basically routine.    │
│ ──────────────────────────────────── │
│ ♥ 12  💬 3  > share                 │
└──────────────────────────────────────┘
```

### 6.2 Variations

**Own post:**
```
┌──────────────────────────────────────┐
│ $ @me ~/feed $ just now          [x] │
│ ──────────────────────────────────── │
│ body…                                │
└──────────────────────────────────────┘
```

**System message (recovery):**
```
┌──────────────────────────────────────┐
│ # system ~/status $ now       [INFO] │
│ ──────────────────────────────────── │
│ [OK] Claude Code API recovered       │
│ [→] Go code!                         │
└──────────────────────────────────────┘
```

## 7. Component catalog

### 7.1 TerminalButton

Minimal text-only button wrapped in square brackets.

```
[run command]   default       (text-muted-foreground)
[run command]   hover         (text-foreground)
[disabled]      disabled      (opacity 0.3)
```

Tailwind:
```
text-xs text-muted-foreground hover:text-foreground transition-colors
disabled:opacity-30 disabled:cursor-not-allowed
```

- No border or padding — interaction is conveyed purely by color shift.
- Square brackets wrap the label.
- `focus-visible:text-foreground` for keyboard a11y.

### 7.2 TerminalInput

Prompt-prefixed input:

```
> █                        (empty, with cursor)
> Claude API is down...    (typing)
$ Enter nickname: hacker_dev
```

Shape:

```tsx
<div className="terminal-input-wrapper">
  <span className="prompt-symbol" aria-hidden="true">&gt;</span>
  <input type="text" className="terminal-input" placeholder="Type…" />
</div>
```

### 7.3 TerminalBadge

Accepts a `variant` prop (`success` | `error` | `warning` | `info`),
currently rendered single-color:

```
[DOWN]   text-xs text-foreground   (variant color not applied yet)
[OK]     same
[WARN]   same
```

**Phase 2 plan**: per-variant backgrounds (error=red, success=green,
warning=yellow).

### 7.4 Status indicator

```
● NORMAL      green dot + text
● DOWN        red dot (pulsing) + text
● DEGRADED    yellow dot + text
○ CHECKING    empty gray dot + text
```

```css
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
.status-dot.down { animation: status-pulse 1.5s ease-in-out infinite; }
```

### 7.5 TerminalCard

Simple wrapper. CSS border for the frame.

```tsx
<TerminalCard>
  {/* border border-border bg-card p-4 */}
  <TerminalPrompt user="username" time="2026-03-09T10:00:00Z" id={42} />
  <p>post body</p>
</TerminalCard>
```

**Phase 2 plan**: compound pattern (Header/Divider/Body/Footer) with
box-drawing borders.

### 7.6 TypewriterText

Used on the landing hero and status messages.

```tsx
<TypewriterText
  text="Claude Code API is down."
  speed={50}       // ms per character
  cursor={true}
/>
```

Respect `prefers-reduced-motion` — render fully when set.

## 8. Dark / light mode

### 8.1 Default

Detect system preference (`prefers-color-scheme`) on first visit. User
toggles persist via `localStorage`.

### 8.2 Switching

Controlled by `<html class="dark">`. Tailwind v4 `dark:` variant combined
with CSS variables.

```ts
// stores/themeStore.ts
const setTheme = (theme: 'dark' | 'light') => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
};
```

### 8.3 Light-mode specifics

Keep the CLI aesthetic in light mode:

- Background is off-white `#F5F5F0`, not pure white (paper feel).
- Text is `#2D2D2D`, not pure black (reduces eye strain).
- Borders at `#C8C8C0` hold enough contrast against off-white.

## 9. Responsive design

### 9.1 Breakpoints
```
xs  320 px
sm  640 px
md  768 px
lg  1024 px
xl  1280 px
```

### 9.2 Layout strategy

**Mobile first.** Every component must work at 320 px.

**Current**: `max-w-3xl` (768 px), `px-4` gutter, `mx-auto` center.

| Viewport | Layout |
|---|---|
| ≤ 768 px | Single column, card fills width (`px-4`) |
| > 768 px | `max-w-3xl` centered |

### 9.3 CLI aesthetic at mobile widths

- Box-drawing characters don't shrink (keep font-size stable).
- Long prompt lines ellipsize (`overflow: hidden; text-overflow: ellipsis`).
- Touch targets ≥ 44 × 44 px (WCAG) — achieved via button padding.

## 10. Animation guide

### 10.1 Allowed

| Animation | Usage | Duration |
|---|---|---|
| Cursor blink | `Cursor` | 1 s loop |
| Typewriter | `TypewriterText` | proportional to length |
| Status-dot pulse | `StatusBanner` (DOWN) | 1.5 s loop |
| Fade-in | page swap, feed item enter | 200–300 ms |
| Slide-up | new post enter | 300 ms |

### 10.2 Forbidden

- Excessive bounce / spring.
- 3D transforms, perspective rotation.
- Background particles / moving gradients.
- Gratuitous hover scale.

### 10.3 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`TypewriterText` renders fully when reduced motion is requested.

### 10.4 `motion` (formerly framer-motion) usage

```tsx
// page transition
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.2, ease: 'easeOut' }}
/>

// feed item enter
const feedItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
```

### 10.5 Custom scrollbar

`terminal.css`:

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); }
::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
```

Thin 6 px scrollbar keeps the terminal feel.

## 11. Accessibility

### 11.1 Standard
**WCAG 2.1 AA.**

### 11.2 Contrast check

| Pair | Ratio | Grade |
|---|---|---|
| `#E8E8E8` on `#121519` (dark body) | 13.7:1 | AAA |
| `#ABC95B` on `#121519` (dark primary) | 7.2:1 | AAA |
| `#2D2D2D` on `#F5F5F0` (light body) | 12.1:1 | AAA |
| `#FF6B6B` on `#121519` (dark error) | 4.8:1 | AA |
| `#8B9299` on `#121519` (dark secondary) | 4.6:1 | AA |

All text combinations meet ≥ 4.5:1.

### 11.3 Keyboard navigation

- All interactive elements reachable via Tab.
- Visible focus outline (`:focus-visible`).
- Feed cards: focus lands on individual buttons, not the whole card.
- Modals/overlays: move focus on open, restore on close.

### 11.4 Screen readers

```tsx
// status indicator
<span className="status-dot" aria-hidden="true">●</span>
<span className="sr-only">API status: outage</span>

// box-drawing chars
<span aria-hidden="true">┌─────┐</span>

// timestamp
<time dateTime="2026-03-08T10:30:00Z" title="Mar 8, 2026 10:30">
  5m ago
</time>

// reaction button
<button aria-label="12 likes, press to like">
  <span aria-hidden="true">♥ 12</span>
</button>
```

### 11.5 Live regions

Announce dynamic changes (API status flips, new posts) to assistive tech.

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

## 12. Icon / symbol system

No external icon library. Prefer text symbols and Unicode glyphs.

| Meaning | Symbol | Fallback |
|---|---|---|
| Like | `♥` | `[like]` |
| Comment | `💬` | `[reply]` |
| Share | `↻` | `[share]` |
| Delete | `[x]` | `×` |
| Success | `[OK]` | `✓` |
| Error | `[ERR]` | `✗` |
| Warning | `[WARN]` | `!` |
| Loading | `...` / `▌` | three dots |
| Settings | `[config]` | `⚙` |

---

_Last updated: 2026-04-19_
