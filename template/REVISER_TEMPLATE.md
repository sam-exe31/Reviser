# Reviser — Design Template & Build Brief

> Hand this file to Gemini (or any AI/dev) **together with `theme.css` and `preview.html`.**
> It explains what Reviser is, how the design system works, and the exact rules to
> follow so every screen looks like it belongs to the same product.
>
> **The three files, in one sentence each:**
> - `theme.css` — the entire design system (tokens + classes). Drop it in; it themes the app.
> - `preview.html` — a fully built reference screen (the Dashboard). Copy its patterns.
> - `REVISER_TEMPLATE.md` — this brief. The rules and the "why".

---

## 1. What Reviser is

Reviser is an **AI-powered spaced-repetition study planner** for people grinding
DSA/LeetCode plus CS theory (OS, DBMS). The core loop:

1. **Monthly goals** ("solve 20 array problems", "finish DBMS transactions") get
   **sliced into a daily target** automatically.
2. Every problem you solve enters a **spaced-repetition schedule** (SM-2 / SuperMemo-2):
   the app tells you *what to review today* so knowledge doesn't decay.
3. A **Gemini-powered AI mentor** parses goals from natural language, plans your
   month, and answers questions in a chat.

The emotional target: **a calm reading room, not a gamified dashboard.** The user
is already stressed about interviews — the UI should feel like a quiet almanac that
keeps them oriented, not a casino of badges and alerts.

**Design concept name:** *"Quiet Study Almanac."*

---

## 2. Stack (so you generate compatible code)

| Layer     | Tech                                                                   |
|-----------|------------------------------------------------------------------------|
| Frontend  | **React 19 + Vite 8**, plain CSS (this design system), **lucide-react** icons, canvas-confetti |
| Desktop   | Electron shell (it's a desktop app; assume ~1280px+ but keep it responsive) |
| Backend   | Spring Boot REST API at `http://localhost:8080`                        |
| AI        | Gemini (goal parsing, month planning, chat, insights)                  |

Icons are **lucide-react** — use thin 2px-stroke line icons only. (The preview
inlines equivalent SVG paths because it's standalone; in the real app, import from
`lucide-react`.)

---

## 3. App structure — pages, components, API

### Pages (6 tabs)
| Tab | Route intent | What it shows |
|-----|--------------|---------------|
| **Dashboard** | overview | greeting, retention curve, at-a-glance stats, due-review queue, monthly progress, SM-2 rhythm |
| **Today & Due** | the daily queue | today's sliced tasks + all reviews that are due (SRS) |
| **AI Assistant** | chat | conversation with the Gemini mentor; parses goals, plans, answers |
| **Monthly Goals** | goal CRUD | set/edit monthly targets; see slicing into daily load |
| **Problem Bank** | library | all saved problems (LeetCode etc.), tags, difficulty, recall strength |
| **Review & Insights** | history/analytics | past reviews, streaks, retention analytics |

### Key components
- **Rail / Sidebar** (`.rv-rail`) — 236px, wordmark, 6 nav items, streak sparkline at foot.
- **Topbar** (`.rv-topbar`) — sticky; breadcrumb + date, backend status dot, refresh.
- **Cards / lists / progress lines / interval stations** — see §6.

### API surface (backend contract — don't invent endpoints)
```
GET  /api/daily/today                 → today's sliced task list
POST /api/daily/complete              → mark a daily task done
GET  /api/goals            CRUD       → monthly goals
GET  /api/problems         CRUD       → problem bank
GET  /api/reviews/due                 → items whose SRS interval is up
POST /api/chat/parse                  → NL → structured goals
POST /api/chat/converse               → mentor chat turn
POST /api/chat/plan                   → generate a month plan
GET  /api/insight                     → analytics / retention insight
```

---

## 4. Design philosophy — read this before touching a pixel

**Five rules that define the look. Break these and it stops being Reviser.**

1. **Editorial serif for meaning, sans for machinery.**
   Headings, greetings, big numbers → **Newsreader** (serif). Body, buttons, labels
   → **Plus Jakarta Sans**. Meta/timestamps/intervals → **JetBrains Mono**. The serif
   is the brand's voice; never set a headline in the sans.

2. **Hairlines and dividers, not card sprawl.**
   Don't wrap every item in its own shadowed box. Lists are separated by 1px
   `--border-subtle` rules (see `.rv-review-list`). The "at a glance" stats are **one
   divided panel**, not four floating cards. Reserve real cards (shadow + radius) for
   genuinely elevated things (the retention curve, modals).

3. **Colour means something — the memory lifecycle.** (see §5)
   Never decorate with colour. Each hue maps to a state in the spaced-repetition
   lifecycle. A green bar always means "retained/healthy"; amber always means "due".

4. **One bold moment per screen.** On the Dashboard it's the **memory-retention
   curve that draws itself in on load.** Everything else stays quiet so that one
   thing lands. Don't add a second animated hero elsewhere on the same screen.

5. **Calm, low-glare surfaces.** The canvas is a soft desaturated blue-grey
   (`#e9edf4`), cards are **off-white, never pure `#fff`**, over a faint graph-paper
   grid. It should be usable for a 3-hour study session without eye strain.

### Hard "don'ts" (these read as generic AI output — avoid)
- ❌ Pure white `#fff` cards on a grey page. Use `--bg-card` (`#f9fbfe`).
- ❌ Four identical shadowed metric cards in a row. Use the divided `.rv-glance` strip.
- ❌ ALL-CAPS eyebrows everywhere, `·` middle-dot meta on everything, `→` suffixes on every link. Use these **sparingly and intentionally** (mono eyebrows are fine as accents).
- ❌ Neon / saturated accents. Every accent here is deep enough to sit on light without vibrating.
- ❌ Heavy drop shadows. Shadows are cool-navy-tinted and subtle (`--shadow-card`).
- ❌ Emoji as UI icons. Use lucide line icons.

---

## 5. Colour = the memory lifecycle

This is the semantic key. **Use the token, not a raw hex.** When you need a colour,
ask "what memory state is this?" and pick accordingly:

| Meaning | Token | Hex | Use for |
|---------|-------|-----|---------|
| **Brand / info / primary action** | `--accent-cyan` | `#3a5ce0` | logo, primary buttons, active nav, "recall strength" |
| **Due / needs attention** (warm, never alarming) | `--accent-amber` | `#cf8014` | overdue ticks, due counts, due badges |
| **Retained / healthy / progress** | `--accent-emerald` | `#0e9d6e` | recall-strength bars, completed progress, streak |
| **AI mentor** | `--accent-purple` | `#8b54d9` | anything Gemini says or generates, sparkle icons |
| **Difficulty** | badge classes | — | `.badge-easy` (green) / `.badge-medium` (amber) / `.badge-hard` (rose) |
| **Secondary/gradient partner** | `--accent-indigo` | `#5a54e6` | gradient partner to cyan on progress fills |

Red/rose (`--accent-rose`, `--accent-coral`) is for **hard difficulty and destructive
actions only** — never for "due" (that's amber's job) and never for decoration.

---

## 6. The system — tokens & the classes you'll actually use

Everything is driven by CSS custom properties in `:root`. **Never hardcode a value
that has a token.** Full list is in `theme.css`; the ones you'll reach for constantly:

### Tokens
```css
/* surfaces */      --bg-main --bg-sidebar --bg-card --bg-card-hover --bg-card-inset
/* grid */          --grid-line
/* borders */       --border-main --border-subtle --border-hover
/* ink (never #000)*/--text-serif-title --text-main --text-muted --text-dim
/* accents */       --accent-cyan --accent-amber --accent-emerald --accent-purple --accent-indigo
                    (+ matching --accent-*-glow tints for backgrounds)
/* radii */         --radius-sm(8) --radius-md(12) --radius-lg(16) --radius-xl(22) --radius-full
/* spacing (8pt) */ --sp-1..--sp-8   (4,8,12,16,24,32,48,64px)
/* elevation */     --shadow-card --shadow-hero --shadow-popover --shadow-glow-cyan …
/* easing */        --ease-out (signature)  --ease-soft (micro)
```

### Two class families — this matters
`theme.css` intentionally ships **two** sets of classes:

- **`rv-*` — the new layout system.** This is the target design. `preview.html` is
  built entirely from it. **Build new screens with these, and migrate old ones onto them.**
- **Legacy classes** (`.claude-card`, `.btn-primary`, `.badge-*`, `.retention-bar-*`,
  `.form-input`, `.modal-*`, `.glass-pill`, `.sm2-tag`) — restyled to the same
  aesthetic so the **existing React components keep rendering unchanged** the moment
  you drop in `theme.css`. Treat these as a compatibility bridge, not the goal.

> **Migration guidance for Gemini:** you don't have to rewrite everything at once.
> Dropping `theme.css` in themes the whole app instantly via the legacy classes.
> Then, screen by screen, refactor the markup onto the `rv-*` patterns from
> `preview.html` for the fully realized look.

### The `rv-*` building blocks (copy from `preview.html`)
| Pattern | Class | When to use |
|---------|-------|-------------|
| App frame | `.rv-shell` + `.rv-rail` + `.rv-main` | every screen |
| Reading column | `.rv-container` (max-width **1040px**, centered) | wrap page content — keeps line length disciplined |
| Sticky header | `.rv-topbar` + `.rv-crumb` + `.rv-status` | every screen |
| Editorial hero | `.rv-hero` + `.rv-eyebrow` + `.rv-greet` (serif) + `.rv-sub` | page intros/greetings |
| Elevated card | `.rv-curve-card` (or legacy `.claude-card`) | the one bold element |
| Stats strip | `.rv-glance` + `.rv-glance-cell/num/cap` | 3–4 key numbers (NOT separate cards) |
| Two-column | `.rv-cols` (1.7fr / 1fr) | main content + side panel |
| Section title | `.rv-section-head` (serif h2 + mono/link on the right) | above every section |
| Hairline list | `.rv-review-list` + `.rv-review-item` (+ `.rv-tick`, `.rv-recall`, `.rv-review-btn`) | queues, lists of problems/reviews |
| Progress lines | `.rv-month` + `.rv-progline` (top labels + track + fill) | goal/monthly progress |
| SM-2 timeline | `.rv-rhythm` + `.rv-stations` + `.rv-station` (`.done`) | interval schedule (1d→3d→7d→14d→30d) |
| Streak | `.rv-streak` + `.rv-spark` (7 bars, `.miss` for gaps) | sidebar foot / insights |

---

## 7. Typography

```
Newsreader (serif)      → greetings, all headings (h1/h2/h3), big display numbers.
                          Weight 500–600. Slight negative letter-spacing on large sizes.
                          Use italic <em> in accent-cyan for the emphasized phrase in a headline.
Plus Jakarta Sans       → body copy, buttons, nav labels, form fields. Weight 400–800.
JetBrains Mono          → eyebrows, timestamps, intervals (1d/3d), counts, "mono-label" meta.
                          Small, uppercase, letter-spaced, in --text-dim or an accent.
```
Helper classes: `.font-serif`, `.font-mono`, `.mono-label`.

**Headline pattern** (from the hero) — set it in serif, emphasize one phrase in italic cyan:
```html
<h1 class="rv-greet font-serif">Good evening, Sam.<br><em>Five recalls</em> are ripe today.</h1>
```

---

## 8. Motion — one orchestrated load, then calm

The rule: **animate on arrival, then hold still.** No looping/attention-seeking motion
except the tiny status "breathing" dot.

- **The signature reveal:** the retention curve's line **draws itself left→right**
  (`stroke-dashoffset` → 0 over ~1.7s), the area fades in behind it, then the review-event
  dots pop in one by one. This is the screen's one bold moment. (`.rv-curve-line/area/dot`)
- **Section settle:** page blocks fade-up in a short stagger — `.stagger-in` on a parent,
  or `.animate-fade-in-up` on an element. Keep total under ~0.6s.
- **Micro-interactions:** hover lifts on cards (`translateY(-3px)`), the review button
  fills with cyan on row hover, buttons depress on `:active`. All via `--ease-out`.
- **Status dot:** `.pulsing-dot` gently breathes to show the backend is live.
- **ALWAYS respect reduced motion** — the `@media (prefers-reduced-motion: reduce)`
  block already disables everything and shows the curve in its final state. Don't add
  motion that bypasses it.

Keyframes available: `fadeIn`, `fadeInUp`, `scaleIn`, `modalPop`, `pulseGlow`, `spinSlow`
(loaders), `drawLine` (the curve), `barGrow`, `shimmer` (skeletons).

---

## 9. How to apply the theme (integration)

1. **Drop `theme.css`** into the frontend and import it once at the app root
   (e.g. `import './theme.css'` in `main.jsx`, replacing the old `index.css` theme).
   Because it redefines the same `--bg-*`, `--accent-*`, `--text-*`, `--radius-*`,
   `--shadow-*` variables and legacy class names the components already use, the whole
   app re-themes with **zero component changes**.
2. **Load the fonts** — the `@import` at the top of `theme.css` pulls Newsreader,
   Plus Jakarta Sans, and JetBrains Mono from Google Fonts. (For production, consider
   self-hosting them.)
3. **Then migrate**, screen by screen, onto the `rv-*` patterns using `preview.html`
   as the reference implementation. Start with the Dashboard (already built in the
   preview), then Today & Due (it's the same hairline-list + tick pattern).

### Checklist before you call a screen "done"
- [ ] Content sits in a centered `.rv-container` (≤1040px), not edge-to-edge.
- [ ] Headings are serif; intervals/meta are mono; body is Plus Jakarta Sans.
- [ ] No pure-white cards; no row of identical shadowed metric cards.
- [ ] Every colour maps to a memory-lifecycle meaning (§5) via a token.
- [ ] Exactly one bold/animated moment; the rest is quiet.
- [ ] Icons are lucide line icons, 2px stroke.
- [ ] Works down to ~900px (`.rv-cols`/`.rv-glance` collapse to one column).
- [ ] `prefers-reduced-motion` respected.

---

## 10. Sample content voice

When you need placeholder copy, match this register — **warm, precise, a little
literary; never hype.** Examples from the reference screen:

- Greeting: *"Good evening, Sam. Five recalls are ripe today."*
- Sub: *"Your memory is holding at 94% stability. Clear the ripe reviews before they
  decay, then chip away at today's slice of the monthly plan."*
- Curve caption: *"Each review lifts the curve and pushes the next one further out."*
- SM-2 stations are named for the memory process, not just intervals:
  **Encode (1d) → Consolidate (3d) → Store (7d) → Retain (14d) → Master (30d).**

Avoid: "🚀 Crush your goals!", "You're on fire!", streak-shaming, exclamation marks.
The tone is a calm mentor, not a coach app.

---

*Template v2 · "Quiet Study Almanac". Reference screen: `preview.html`. System: `theme.css`.*
