# Handoff — Omhar's Portfolio (updated 2026-06-17)

Next.js 16 / React 19 / TS / Tailwind v4, deployed on Vercel. Repo:
`OmharRegidor/omhar-portfolio`. Package manager: **pnpm**.

---

# Goal — what we're building

1. **AI chatbot** ("Ask Omhar AI") — answers visitor questions about Omhar and routes
   to a Calendly booking. Free to run. **DONE (Phase 1, merged earlier).**
2. **More interactive portfolio** (motion, microinteractions, analytics).
   **Phase 2 — in progress.**

---

# Current State — where things stand

- **`main` is green, pushed, and CI-passing.** The ⌘K command palette was built and shipped
  (`93f436b`), then **reverted on the owner's request** (`e09fa76`): they didn't want the
  visible "Go to…" trigger, and without it the palette had no discoverable entry (mouse/
  mobile). The `undici` CI audit fix (`7336f20`) **stays** (it's independent of the palette).
  `origin/main` is in sync and Vercel has deployed.
- **Net effect of the palette episode:** the only lasting change is that the **theme switch is
  now global** — rendered in `app/layout.tsx` (fixed top-right) on every page, so sub-pages
  have a theme toggle too (it used to be homepage-only, inside `ProfileCard`).
- **Phase 2 progress:** motion foundation ✅ · launcher breathing ring ✅ · two chat
  bug-fixes ✅ · homepage scroll-reveals ✅ · ~~⌘K command palette~~ (built, then **reverted**).
  **One roadmap item remains: conversion analytics** (see **Next move**).

## What shipped (newest first, all on `main`)

| PR | Commit | What |
|----|--------|------|
| pushed | `e09fa76` | **Reverted the ⌘K command palette.** Owner rejected the visible "Go to…" trigger on sight; without it the palette had no discoverable entry, so the whole feature was removed (components, `SiteControls`, unit + e2e tests). **Kept:** the theme switch, now rendered globally in `app/layout.tsx` (fixed top-right) so every page has a toggle. Design spec/plan retained as history. |
| pushed | `7336f20` | **CI fix:** pinned `undici` to `^7.28.0` via `pnpm.overrides` to clear new HIGH audit advisories (dev-only, transitive via `jsdom`). See Gotcha #1. **Kept** (independent of the palette). |
| pushed | `93f436b` | **⌘K command palette** (shipped, later reverted by `e09fa76`) — keyboard-first quick-nav + a visible "Go to…" pill over the 5 pages. Built on the existing Radix dialog; moved the theme switch into a global cluster. |
| #7 | `5c09318` | **Homepage scroll-reveals** — sections fade up on first scroll into view. Also bumped `vite`→8.0.16 (CI audit fix, see Gotchas). |
| #6 | `d8ed94a` | **Launcher breathes continuously** (superseded #4's stop-after-first-open, which the owner couldn't see in practice). |
| #5 | `520d707` | **Chat fixes:** rate limiter now **fails open** instead of returning 503 (was showing the generic "something went wrong" reply locally / on an Upstash blip); header `pr-8` so "Book a call" no longer overlaps the dialog ✕. |
| #4 | `0c8b3e1` | **Launcher breathing ring** (initial version). |
| #3 | `bf296ba` | **Motion design system foundation** — duration tokens, `ease-brand`, reduced-motion guard. |

---

# Architecture & conventions established (READ before adding features)

**Motion design system** lives in `app/globals.css`:
- Duration tokens: `--motion-fast/base/slow/deliberate` = 120/200/320/520ms (in `@theme`).
- Easing: `--ease-brand: cubic-bezier(0.2,0,0,1)` → generates the `ease-brand` utility.
- Ergonomic `@utility duration-fast/base/slow/deliberate` shims.
- `--animate-breathe` keyframe (launcher ring).
- **Reduced-motion guard** (Andy-Bell reset): `@media (prefers-reduced-motion: reduce)`
  clamps all transitions + animations to `0.01ms` and disables smooth scroll.
- **Convention:** author all motion with the `motion-safe:` prefix. New transforms must be
  `motion-safe:`-gated. Decorative transforms gate both transition + transform; functional
  ones (e.g. the theme-switch knob) gate only the transition so state still shows.

**`<Reveal>` component** (`components/motion/reveal.tsx`) — reusable scroll-reveal wrapper.
- 3-phase model: `initial` (visible) → IntersectionObserver hides off-screen blocks →
  reveals on enter. **Decides via the IO callback (post-layout), NOT a synchronous
  `getBoundingClientRect` at mount** (that mis-fires before images/fonts settle — this was
  a real bug, see Gotchas). Skips `display:none` blocks. Once-only; `opacity`+`transform`
  only (no CLS). Used on `app/page.tsx` to wrap the ~10 section blocks (hero excluded, LCP).

**Theme switch is global.** `app/layout.tsx` renders `<ThemeSwitch />` fixed top-right
(`fixed right-4 top-4 z-40 sm:right-6 sm:top-6`) on **every** page, so sub-pages have a theme
toggle too. (It used to live inside `ProfileCard`, homepage-only; the palette work moved it
global, and the revert kept that improvement by rendering it directly in the layout.)

**⌘K command palette — REMOVED (`e09fa76`).** It was designed, built (spec + plan still in
`docs/superpowers/`), shipped (`93f436b`), then reverted when the owner rejected the visible
trigger. **Lesson if revisited:** a ⌘K palette is a power-user pattern; for a recruiter/client
audience a plain **visible nav bar/header** reads better than a keyboard-first overlay (the
owner's reaction confirmed this). The `ui/dialog.tsx` reuse pattern from that work is still
documented in Gotcha #8.

**Specs** are in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`:
- `2026-06-15-phase2-motion-design-system-design.md`
- `2026-06-15-launcher-breathing-ring-design.md`
- `2026-06-16-scroll-reveals-design.md`
- `2026-06-17-command-palette-design.md` (+ `plans/2026-06-17-command-palette.md`) —
  **feature reverted; kept as history.**

---

# Key files

**⌘K command palette — REMOVED (`e09fa76`):**
- Deleted: `components/command-palette/*` (`nav-items.ts`, `filter.ts`, `command-palette.tsx`),
  `components/layout/site-controls.tsx`, and the palette tests
  (`tests/unit/{filter,command-palette,site-controls}.test.ts(x)`, `tests/e2e/command-palette.spec.ts`).
- `app/layout.tsx` — now renders a global `<ThemeSwitch />` (fixed top-right) instead of the
  removed `<SiteControls />`.
- `components/hero/profile-card.tsx` — no longer renders the theme switch (it's global now).
- Design docs retained: `docs/superpowers/specs/2026-06-17-command-palette-design.md`,
  `docs/superpowers/plans/2026-06-17-command-palette.md`.

**Deps (kept):**
- `package.json` / `pnpm-lock.yaml` — `vite` pinned to `8.0.16`; `pnpm.overrides` has
  `esbuild >=0.28.1` and **`undici ^7.28.0`** (CI audit fixes, see Gotcha #1).

**Prior session (motion / reveals / chat):**
- `app/globals.css` — motion tokens, `ease-brand`, `--animate-breathe`, reduced-motion guard.
- `components/motion/reveal.tsx` — scroll-reveal component.
- `app/page.tsx` — section blocks wrapped in `<Reveal>`.
- `components/chat/chat-launcher.tsx` — always-on breathing ring.
- `components/chat/chat-panel.tsx` — header `pr-8`; reduced-motion-aware auto-scroll
  (`scrollIntoView` honors `matchMedia` since CSS can't govern an explicit `behavior`).
- `app/api/chat/route.ts` — rate limiter **fails open** on outage (mirrors `usage.ts`).
- `components/{theme/theme-switch,sections/*,ui/{button,carousel},layout/back-to-home}.tsx`
  + `app/error.tsx` — retrofitted bare transitions to `motion-safe:`.
- `.gitignore` — `.superpowers/` (visual-brainstorm mockups + SDD scratch).

---

# Gotchas / lessons learned (these cost time — avoid re-learning)

1. **CI audit gate.** `.github/workflows/ci.yml` runs `pnpm audit --audit-level=high` and
   fails the build on any HIGH advisory. A new `vite` HIGH (GHSA-fx2h-pf6j-xcff, dev-only)
   blocked PR #7. **A pnpm `overrides` entry did NOT upgrade `vite`** (it's an auto-installed
   peer of vitest/@vitejs/plugin-react). Fix that worked: declare it as a **direct
   devDependency** (`"vite": "8.0.16"`). Watch for new advisories on future PRs.
   **2026-06-17 recurrence:** new HIGH `undici` advisories (dev-only, transitive via
   `jsdom`) blocked a push. Fixed with a `pnpm.overrides` entry (`7336f20`) — but **bound the
   range**: an unbounded `">=7.28.0"` pulls `undici` 8.x, which removes
   `lib/handler/wrap-handler.js` and breaks jsdom (every unit file errored). `"^7.28.0"`
   (stay in the 7.x line) clears the advisory and keeps jsdom working. (A stale
   `undici@8.5.0` may linger in the pnpm store — harmless; `pnpm audit` confirms no high.)
2. **Scroll-reveal timing.** Deciding in-view via a synchronous `getBoundingClientRect` at
   mount is WRONG — layout isn't settled (images/fonts), so below-fold blocks read as
   in-view and reveal early. Use the IO callback (post-layout). Already fixed in `<Reveal>`.
3. **axe + opacity-0.** A reveal's transient `opacity-0` makes axe report false-positive
   color-contrast failures (it blends text toward the page bg). The a11y e2e now emulates
   `reducedMotion: "reduce"` so axe assesses the truly-rendered (revealed) contrast.
4. **`react-hooks/set-state-in-effect` lint rule.** Mount-time, browser-only `setState`
   (reading matchMedia/sessionStorage/navigator) trips it; add `// eslint-disable-next-line
   react-hooks/set-state-in-effect` (pattern from `theme-switch.tsx`). Note: the rule
   sometimes doesn't fire (e.g. when the value isn't a literal or a DOM read precedes it) —
   then remove the now-unused directive (it warns).
5. **PR ordering trap.** PR #4 was merged with the early launcher version BEFORE the
   "always-breathe" update reached it; fixed via a follow-up (#6). Before merging, confirm
   the branch has all intended commits.
6. **Local chat.** For real AI answers locally, `.env.local` needs `GROQ_API_KEY` +
   `RATE_LIMIT_BYPASS=1`. With the #5 fail-open fix, a missing limiter now degrades to the
   static "book a call" reply instead of erroring.
7. **Run lint as a per-task gate, not just tests.** During the palette build, a task that
   ran only `pnpm test` committed code that failed `pnpm lint` (the `set-state-in-effect`
   rule above) — caught a task later. Run `pnpm lint` alongside `pnpm test` for every change.
8. **Reuse `ui/dialog.tsx` for overlays.** `DialogContent` gives Portal + Overlay + ✕ +
   focus-trap + Escape + scroll-lock + `motion-safe:` animations for free. Override
   position/padding via `className` — tailwind-merge resolves `top-*`/`translate-y-*`/`p-*`
   and treats `grid`→`flex` as the same group. (Pattern from the now-removed palette.)
9. **Validate UX direction with the owner BEFORE building, not after.** The ⌘K palette passed
   every gate and review, then was rejected on sight for its visible trigger — a full
   build→ship→revert round-trip. For owner-facing UI, get a quick look/approval of the actual
   on-screen treatment (the visual companion or a deployed preview) before the full TDD build.

---

# Open action items (owner's, carried over)

- ✅ **`main` pushed & CI-green** — palette `93f436b`, undici CI fix `7336f20`, palette revert
  `e09fa76`; `origin/main` in sync, Vercel deployed.
- **Rotate the Groq key** — precautionary (briefly sat in a committed template earlier,
  never pushed). After rotating, update Vercel + `.env.local`.
- `.env.example` is still locally modified (empty placeholder + "keep empty" warning) —
  safe to commit whenever. `Handoff.md` (this file) is untracked — keep local or commit as
  you like. `.superpowers/` (brainstorm mockups + SDD ledger/briefs/reports) is gitignored
  scratch — delete anytime.

---

# How we work (the loop that's been effective)

For each feature: **brainstorm (superpowers:brainstorming, with the visual companion for
visual decisions) → write + commit a spec in `docs/superpowers/specs/` → write + commit a
plan in `docs/superpowers/plans/` → TDD (red→green) → gates (lint · tsc · unit · build ·
e2e) → live verification → review → integrate.** The ⌘K palette used
**superpowers:subagent-driven-development** (fresh implementer subagent per task, spec+quality
review each, a whole-branch review, then the gate sweep) — it produced clean, green code that
was nonetheless reverted on owner taste. **Takeaway:** the loop guarantees correctness, not
desirability — confirm the UX direction early (see Gotcha #9).

Commit style: clean conventional messages, **no `Co-Authored-By` trailer** (owner pref).
Branch off `main`; squash to one commit per feature on `main`; delete the branch.

---

# Next move — the single next thing

The ⌘K command palette was built then **reverted** (`e09fa76`) — see above. One Phase-2
roadmap item remains:

1. **Conversion analytics** — privacy-light tracking of key actions (chat opened, message
   sent, "Book a call"/Calendly clicks) to measure the funnel. Decide a free, privacy-
   friendly approach (e.g. Vercel Analytics custom events) during brainstorm. This is
   non-visual, so it sidesteps the taste risk that sank the palette.

If site navigation is revisited later: the owner rejected the keyboard-first ⌘K palette —
consider a **plain visible nav bar/header** instead (clearer for a recruiter/client audience),
and validate the look early.

Start by invoking the brainstorming skill for conversion analytics, then follow the loop above.
