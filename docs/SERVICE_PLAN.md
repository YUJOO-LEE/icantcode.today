# SERVICE_PLAN — icantcode.today

> "Where coders gather when the Claude Code API dies."

## 1. Overview

### Service name
**icantcode.today**

### One-liner
A developer community SNS that activates only when the Claude Code API is
down.

### Core concept

```
API normal  →  landing page (community locked)
API down    →  community feed opens (anonymous posting and commenting)
```

Users come here when they can't code. The terminal-inspired UI is deliberate:
to a non-developer looking over your shoulder, it should look like you're
working.

### Project nature

- Personal/community project. No monetization.
- Open-source by intent.
- Built by Claude Code users, for Claude Code users.

## 2. Audience

### Primary target
- Claude Code users who hit outages in the middle of their work.

### Persona

```
Name: Kim Dev (32, backend engineer)
Situation: Deadline tomorrow, Claude Code API just died.
Question: Is it just me? How long? How are others handling it?
Action:    Open icantcode.today → check peers venting, joking, and sharing tips.
```

## 3. Core mechanics

### 3.1 API-status gating

Access flips based on Claude Code API state.

| API state | Experience |
|---|---|
| `normal` | Landing page only. Feed is fully hidden (no component render). "Get back to work" message. |
| `down` | Feed opens. Free posting, reading, commenting. |
| `checking` | Status-check animation. Re-checks every 30 s. |

> The code-level enum lives in `src/types/api.ts` as
> `type ApiStatus = 'normal' | 'down' | 'checking'`. A `degraded` state is
> not implemented yet — if/when added, it should open the feed like
> `down`.

### 3.2 CLI aesthetic

- Box-drawing characters (`┌─┐`, `│`, `└─┘`).
- Prompt symbols (`>`, `$`, `#`).
- Blinking cursor.
- Typing effect on status messages.
- MulmaruMono (self-hosted).

**Goal**: a non-developer glances at the screen and assumes "they're doing
something serious."

## 4. User flow

### 4.1 Single-route model

```
/  (root — the only route)
    ↓
  API status poll (every 30 s)
    ↓
  ├── normal → landing view
  └── down   → same URL swaps to feed view
```

- No separate `/feed` path. State-based conditional rendering.
- Normal ↔ down toggles the UI without any URL change.

### 4.2 End-to-end flow

```
User lands
  ↓
API status poll (30 s interval)
  ↓
  ├─ normal ──────────────────────────────────────────────┐
  │                                                       │
  │   Landing (at /)                                      │
  │   - "You can code right now" message                  │
  │   - Service intro (community opens only during outage)│
  │   - Past outage log / recent activity preview         │
  │                                                       ◄── re-check every 30 s
  └─ down ─────────────────────────────────────────────────┐
                                                           │
     Feed renders immediately (reading is free, no nickname)│
     │                                                     │
     ├── scroll / read / like → no nickname required       │
     └── post / comment click → nickname check             │
          │                                                │
          ├── nickname present → direct write              │
          └── nickname absent → inline nickname prompt     │
               (set once, reused for the whole session)    │
                                                           │
          └─────────────────────────────────────────────►┘
```

### 4.3 Delayed nickname entry

**Rule: the nickname must never block feed reading.**

```
Outage detected → feed renders (read free, no nickname)
  ↓
  Click "new post" or "comment"
  ↓
  ├─ nickname present → write immediately
  └─ nickname absent → inline prompt
       ↓
       Store in sessionStore (memory only)
       ↓
       Reused until refresh
```

- No nickname? → scroll, read, like still work.
- Write actions are the only trigger for the nickname check.
- Once set, the nickname lives for the session (until refresh).

### 4.4 Returning user (during outage)

```
Outage detected → visit icantcode.today
  ↓
Feed renders immediately (no nickname prompt)
  ↓
  ├─ Scroll the timeline (peers in the same boat)
  ├─ Read / like (no nickname needed)
  ├─ Post → if nickname unset, inline prompt
  ├─ Comment → if nickname unset, inline prompt
  └─ On recovery → banner: "API is back! Go code."
```

> Reloads issue a new UUID. Previous posts are read-only for the new
> session. Nickname also clears. Intentional — lightweight anonymous
> participation.

## 5. Features and priorities

### P0 — MVP (must ship)

#### 5.1 API status monitoring
- Poll the Claude Code API every 30 s.
- Status values (see `src/types/api.ts`): `normal` | `down` | `checking`.
- UI updates immediately on status change.
- Distinguish transient network blips from real outages.

#### 5.2 State-based screen transitions
- No separate route — conditional render at `/`.
- Normal → landing, feed not mounted.
- Down → feed view replaces landing in place.
- Smooth transition animation.
- Tab title reflects state (e.g., `[DOWN] icantcode.today`).

#### 5.3 Feed
- Post (text, up to 500 chars).
- Timeline (newest first).

#### 5.4 Comments
- Per-post create / read.
- Show comment count.

#### 5.5 Anonymous session + delayed nickname
- No signup.
- `userCode` (UUID) generated on load via `generateUUID()` which wraps
  `crypto.randomUUID()` (see `src/lib/utils.ts`).
- Nickname requested only on first write.
- Once set, reused per-session.
- Refresh = new `userCode` + cleared nickname → old posts read-only.
- Neither `userCode` nor the nickname is persisted to localStorage.

### P1 — Post-MVP

- **5.6 Infinite scroll** (IntersectionObserver).
- **5.7 Likes / reactions** (toggle, live count).
- **5.8 Dark/light mode** (system default, manual toggle, `localStorage`).
- **5.9 i18n** (ko default, en, react-i18next, preference in `localStorage`).

### P2 — Expansion

- **5.10 Post delete** (own posts, current session only).
- **5.11 User profile** (own posts, optional bio).
- **5.12 Notifications** (comment-on-my-post, optional Web Push).

## 6. Non-functional requirements

### Performance
- First contentful paint ≤ 3 s on 3G.
- Polling pauses when tab is hidden (`visibilitychange`).
- Text-only feed keeps things fast.

### Accessibility
- WCAG 2.1 AA.
- Full keyboard support.
- Screen-reader friendly (ARIA).
- `prefers-reduced-motion` respected.

### Security
- XSS defenses (escape all user input, i18n `escapeValue: true`).
- CSRF token if and when cookie-based auth is added.
- Rate limiting on the backend.

### Responsiveness
- Mobile-first.
- Breakpoints: xs 320 px · sm 640 px · md 768 px · lg 1024 px · xl 1280 px.

## 7. Monetization

**None.** Pure community project.

- No ads.
- No paid tiers.
- No data sale.

If hosting costs become a problem, consider voluntary sponsorship (GitHub
Sponsors, Buy Me a Coffee).

## 8. Launch strategy

### Phase 0 — MVP development
- Ship all P0.
- Apply base design system.
- Recruit a few beta testers from Claude Code heavy users.

### Phase 1 — Soft launch
- Share in Claude Code communities (Discord, X/Twitter, Reddit).
- Expect organic traffic on the next real outage.

### Phase 2 — Feature expansion
- Ship P1 incrementally.
- UX improvements from user feedback.

## 9. Success metrics

| Metric | Target |
|---|---|
| MAU during an outage | 1,000+ |
| Avg. session length | 5 min+ |
| Posts per outage | 50+ |
| Return rate | ≥ 40% |
| GSC indexing | 1 URL indexed |
| GSC impressions | Monthly impressions on "claude code down/outage" queries |
| Lighthouse SEO | 100 (CI guard) |

---

_Last updated: 2026-04-19_
