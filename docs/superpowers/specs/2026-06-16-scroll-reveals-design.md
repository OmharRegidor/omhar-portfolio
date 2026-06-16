# Phase 2 — Homepage Scroll-Reveals

**Date:** 2026-06-16
**Status:** Approved (design) → ready for implementation
**Branch:** `phase2-scroll-reveals`
**Phase:** 2 (Interactivity) — third feature on top of the motion foundation
**Depends on:** `2026-06-15-phase2-motion-design-system-design.md` (duration tokens,
`ease-brand`, `motion-safe:` convention, reduced-motion guard)

## Goal

As the visitor scrolls the homepage, each content section gently **fades up** into
place the first time it enters the viewport — adding life without distraction.

Chosen direction:
- **Scope:** homepage only (sub-pages unchanged; easy to extend later).
- **Style:** subtle fade-up — opacity 0→1 while rising ~12px, with the brand ease-out.
- **Granularity:** each section reveals as one block (no per-child stagger; sibling
  sections stagger naturally by scroll position).

Non-negotiables (baked in, not optional):
- **Reveal once** — never re-hide on scroll-up.
- **Reduced motion** — content just appears instantly; no hide, no observer.
- **Progressive enhancement** — content is fully visible without JS; anything in view
  on load reveals immediately (no flash); `opacity`+`transform` only (no layout shift).

Non-goals: sub-pages, per-child stagger, scroll-linked/parallax effects, revealing the
hero (see §2).

## Context (current state)

- `app/page.tsx` — a hero `<ProfileCard />` followed by a two-column grid of ~10
  section blocks, each wrapped in an `order-*` div used for the mobile `display:contents`
  interleave trick. Left column: About, TechStackPreview, RecentProjects,
  RecentCertifications, SocialLinks. Right column: ExperienceTimeline, PartnerCta,
  RecommendationsCarousel, MembershipBlock, Gallery.
- No existing IntersectionObserver / scroll-reveal anywhere (`animate-in` hits are only
  the Radix dialog/sheet enter states). This is built fresh.
- Available to build on: Phase-2 motion tokens (`--motion-slow` = 320ms, `ease-brand`),
  the `motion-safe:` authoring convention, and the global reduced-motion guard.

## Design

### 1. New component — `components/motion/reveal.tsx`

A `"use client"` component that wraps one block and reveals it on first scroll-in.

**Props**
- `children: ReactNode`
- `className?: string` — forwarded to the wrapper `<div>` so it can carry the
  `order-*` classes (and anything else) the block already needs.

**Behavior (progressive enhancement, flash-free)**
- The wrapper renders a `<div>` around `children`. A single `phase` state drives it:
  `"initial"` → `"hidden"` → `"shown"`.
  - **Before mount** (SSR + first client paint + no-JS): `phase = "initial"` → visible,
    **no** transition/hidden classes → content is always present and crawlable, zero
    layout shift, no hydration mismatch.
  - **On mount** (effect): if `prefers-reduced-motion: reduce`, no `IntersectionObserver`,
    or the element is `display:none` (an empty section collapsed by `empty:hidden` — which
    can never intersect) → `phase = "shown"` and stop (visible, no observer).
  - Otherwise `observe()` the element. The IO callback runs **post-layout**, so its
    intersection verdict is reliable even while images/fonts are still settling — a
    synchronous mount-time `getBoundingClientRect` is NOT (it mis-hides content before
    layout settles, which is the bug this design avoids):
    - First report **off-screen** → `phase = "hidden"` (paints off-screen, no visible flash).
    - **In view** (first report or later, on scroll-in) → `phase = "shown"`, then
      `disconnect()` (once-only). Above-fold blocks stay visible the whole time — no flash.
  - Cleanup disconnects the observer (also covers React StrictMode's double-mount).

**Classes** (the transition + hidden state only exist once `phase !== "initial"`, so they
never reach SSR):
```tsx
className={cn(
  phase !== "initial" && "motion-safe:transition-[opacity,transform] motion-safe:duration-slow motion-safe:ease-brand",
  phase === "hidden" ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0",
  className,
)}
```
- `translate-y-3` = 12px rise. Duration `--motion-slow` (320ms) as a starting point —
  fine-tuned live; bump toward `--motion-deliberate` for more presence.
- All motion is `motion-safe:`-gated and the hidden state is unreachable under reduced
  motion (`phase` is forced to `"shown"` there), so reduced-motion users get instant,
  static content — the global guard is a redundant backstop.

This component has one clear job (reveal a block on first view), a tiny interface
(`children` + `className`), and depends only on the DOM + React.

### 2. Apply on the homepage — `app/page.tsx`

Replace each section block's `<div className="order-…">` with
`<Reveal className="order-…">…</Reveal>` (≈10 blocks). The Reveal renders the same
`<div>` with the same classes, plus the reveal behavior — so layout is unchanged.

**The hero `<ProfileCard />` is intentionally NOT wrapped** — it's above the fold and the
LCP element; revealing it adds no value (it would reveal instantly anyway) and we keep the
LCP paint pristine.

Mobile note: the `order-*` divs sit under a `display:contents` parent, so they're flex
children of the grid container on mobile. `opacity`/`transform` on flex children is fine —
no layout impact.

### 3. Testing

1. **Unit (RTL, `tests/unit/reveal.test.tsx` — new):** stub `IntersectionObserver`
   (capturing its callback) and `window.matchMedia`.
   - Renders its children and forwards `className`.
   - Reduced-motion (`matchMedia → matches:true`): visible (`opacity-100`), **no** observer.
   - Before any callback (`phase = "initial"`): visible, no transition class (so SSR/first
     paint never hides it).
   - Motion allowed: a first **off-screen** report sets the hidden state; a later
     `isIntersecting:true` entry flips it to shown and calls `disconnect` (once-only).
   - A first **in-view** report reveals immediately without ever hiding.
   - A `display:none` block (mocked) is revealed without creating an observer.
   - Assert on class presence (`opacity-0` vs `opacity-100`), not computed animation
     (jsdom doesn't run CSS).
2. **e2e (Playwright, extend/add):**
   - Motion allowed: a below-fold section starts below opacity 1, then reaches opacity 1
     after `scrollIntoView`.
   - `reducedMotion: "reduce"`: sections report opacity 1 **without** scrolling.

No `globals.css` change — the reveal is built from existing tokens + Tailwind utilities.

## Acceptance criteria

- [ ] `<Reveal>` component exists with the `children` + `className` interface.
- [ ] Homepage section blocks fade up on first scroll-in; the hero is not wrapped.
- [ ] Above-fold / in-view blocks reveal immediately (no flash); below-fold reveal on enter.
- [ ] Reveal is once-only (no re-hide on scroll-up); observer is disconnected after.
- [ ] Reduced motion → all blocks visible instantly, no observer.
- [ ] No-JS / pre-hydration → content fully visible; no layout shift (CLS).
- [ ] Unit + e2e tests pass; `lint`, `tsc`, `test`, `build`, `e2e` all green.

## Risks

- **Above-fold flash** — mitigated by deciding via the **post-layout IO callback** (never a
  synchronous mount-time measurement, which mis-fires before layout settles) and by keeping
  the hidden state off SSR (`phase` starts `"initial"`/visible). Above-fold blocks are never
  put into the hidden state.
- **LCP regression** — mitigated by excluding the hero from reveal.
- **jsdom lacks `IntersectionObserver`** — the unit test stubs it; the component guards
  `typeof IntersectionObserver === "undefined"` so it degrades gracefully where absent.
