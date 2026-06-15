# Phase 2 — Motion Design System (Foundation)

**Date:** 2026-06-15
**Status:** Approved (design) → ready for implementation plan
**Branch:** `phase2-motion-foundation`
**Phase:** 2 (Interactivity) — foundation step

## Goal

Establish the motion foundation that every later Phase 2 feature (launcher
breathing ring, IntersectionObserver scroll-reveals, ⌘K command palette,
conversion analytics) will build on:

1. A small, named **duration scale** and **one brand easing curve** as design
   tokens.
2. **Ergonomic Tailwind v4 utilities** so call sites read cleanly.
3. A **strict `prefers-reduced-motion` contract**: transforms disabled, short
   opacity/color fades kept at ≤120ms.
4. Fix the **existing inconsistency** where some transitions respect reduced
   motion (`motion-safe:`) and some don't (bare `transition-colors`).

Non-goal: building any of the actual Phase 2 features. This is only the
foundation they depend on.

## Context (current state)

- Tailwind v4, CSS-first config via `@theme` in `app/globals.css`. No motion
  library (no framer-motion); all motion is Tailwind utility classes.
- Design language: sharp/minimal — `--radius-*: 2px`, HSL token pairs for
  light/`.dark`, Open Runde font, `*:focus-visible` accent ring.
- **No motion tokens exist yet.** Durations are ad-hoc literals (`duration-300`
  in `gallery.tsx`, `duration-500` in `profile-card.tsx`). Easings are stock
  (`ease-out`, `ease-in-out`).
- **Reduced-motion handling is inconsistent:**
  - Correctly gated: chat components, `featured-award.tsx`, Radix `sheet.tsx` /
    `dialog.tsx` (`motion-safe:` / `data-[state]:motion-safe:animate-*`), and
    `carousel.tsx` (JS `matchMedia`).
  - **Not gated (bare):** `transition-colors` in `button.tsx`, `project-card`,
    `cert-card`, `social-links`, `back-to-home`, `experience-timeline`,
    `error.tsx`, `gallery` overlay buttons, `carousel` dots; bare
    `transition-transform` in `theme-switch.tsx` (knob) and `gallery.tsx`
    (image `scale-105`).

## Design

### 1. Tokens — `app/globals.css` `@theme`

Added to the existing `@theme` block (co-located with `--radius-*` / `--text-*`):

```css
/* Motion — duration scale (emitted as :root CSS custom properties) */
--motion-fast: 120ms;        /* micro-feedback: color/opacity hovers */
--motion-base: 200ms;        /* default UI transitions */
--motion-slow: 320ms;        /* larger surfaces: panels, reveals */
--motion-deliberate: 520ms;  /* showcase: hero, staggered entrances */

/* One brand easing curve — Tailwind v4 turns --ease-* into the `ease-brand` utility */
--ease-brand: cubic-bezier(0.2, 0, 0, 1);  /* fast departure, smooth settle */
```

- `--ease-brand` **must** live in `@theme` so Tailwind v4 generates a real
  `ease-brand` utility (`transition-timing-function: var(--ease-brand)`).
- Easing rationale: `cubic-bezier(0.2, 0, 0, 1)` is a strong, confident
  decelerate that complements the sharp 2px aesthetic. Runner-up considered and
  rejected for being softer than the brand wants: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Durations are emitted as `:root` vars; they are the single source of truth
  consumed by the `@utility` shims below and by any arbitrary-value call site.

### 2. Ergonomic utilities — `@utility` shims (top level in `globals.css`)

```css
@utility duration-fast       { transition-duration: var(--motion-fast); }
@utility duration-base       { transition-duration: var(--motion-base); }
@utility duration-slow       { transition-duration: var(--motion-slow); }
@utility duration-deliberate { transition-duration: var(--motion-deliberate); }
```

Future Phase 2 code reads cleanly, e.g.:
`motion-safe:transition-transform duration-base ease-brand`.

**Risk + fallback:** these named classes share the `duration-` prefix with
Tailwind's numeric `duration-<number>` functional utility. Expected to coexist
(static `@utility` defines literal classes; numeric utility only matches numbers).
**Acceptance includes a clean `pnpm build`** proving no collision/warning. If a
collision appears, fall back to the Tailwind v4-native shorthand
`duration-(--motion-base)` at call sites and drop the shims.

### 3. Reduced-motion contract — two layers

**Layer A — global safety net** (new block in `app/globals.css`):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;       /* kill keyframe motion */
    animation-iteration-count: 1 !important;
    transition-duration: var(--motion-fast) !important;  /* clamp any stray transition to ≤120ms */
    scroll-behavior: auto !important;
  }
}
```

**Layer B — convention + retrofit:** all *transform* motion in our code is gated
with `motion-safe:`, so under reduced motion its `transition-property` is absent
and the transform is genuinely disabled (not merely fast). Color/opacity fades
survive, clamped by Layer A to ≤120ms.

**Net effect of A+B:** transforms off; short fades kept — exactly the contract.

Why both layers: Layer B makes our own intent explicit and predictable; Layer A
is the universal net for anything un-gated, third-party, or future-authored.

### 4. Retrofit scope (fix the existing inconsistency)

**Gate bare transform transitions** (→ disabled under reduced motion):
- `components/theme/theme-switch.tsx` — knob `transition-transform` → `motion-safe:transition-transform`.
- `components/sections/gallery.tsx` — image hover `transition-transform … scale-105` → `motion-safe:` gated.

**Gate bare `transition-colors`** (→ `motion-safe:transition-colors`):
- `components/ui/button.tsx` (base CVA string — collapses many call sites at once)
- `components/sections/project-card.tsx`
- `components/sections/cert-card.tsx`
- `components/sections/social-links.tsx`
- `components/layout/back-to-home.tsx`
- `components/sections/experience-timeline.tsx`
- `app/error.tsx`
- `components/sections/gallery.tsx` (3 overlay buttons)
- `components/theme/theme-switch.tsx` (track `transition-colors`)
- `components/ui/carousel.tsx` (dot indicators)

Real count is ~10–12 spots (the "~6" earlier estimate was low); the shared
`button.tsx` base collapses several.

**Left intentionally bare (the kept fades):**
- `components/hero/profile-card.tsx` — opacity crossfades; become the canonical
  "≤120ms opacity fade," clamped by Layer A.
- `components/ui/dialog.tsx` / `sheet.tsx` close buttons — bare
  `transition-opacity`; opacity, kept and clamped by Layer A.

**Out of scope (follow-up, not this change):** migrating existing
`duration-300` / `duration-500` literals to the new tokens. The foundation does
not require it.

## Testing

To be written test-first during implementation (TDD):

1. **Static (vitest)** — read `app/globals.css` and assert presence of:
   `--motion-fast: 120ms`, `--motion-base: 200ms`, `--motion-slow: 320ms`,
   `--motion-deliberate: 520ms`, `--ease-brand:`, the four `@utility duration-*`
   shims, and the `@media (prefers-reduced-motion: reduce)` guard block.
2. **Behavioral (Playwright e2e)** — load the home page with
   `emulateMedia({ reducedMotion: 'reduce' })`; assert a sampled interactive
   element's computed `transition-duration` ≤ 120ms, and that the global guard
   applies.
3. **Build** — `pnpm build` succeeds (validates the `@utility` shims compile and
   don't collide with Tailwind's numeric `duration-*`).

## Acceptance criteria

- [ ] Duration tokens + `--ease-brand` present in `@theme`; `ease-brand` utility usable.
- [ ] Four `duration-*` `@utility` shims present and compiling.
- [ ] Global `prefers-reduced-motion` guard present (kills animations, clamps
      transitions to ≤120ms, disables smooth scroll).
- [ ] All bare transform transitions gated with `motion-safe:`.
- [ ] All bare `transition-colors` gated with `motion-safe:` per the list above.
- [ ] `profile-card` opacity fades left bare (kept, clamped).
- [ ] Static + e2e tests pass; `pnpm build`, `pnpm lint`, `tsc`, `pnpm test`,
      `pnpm e2e` all green.

## Risks

- **Utility-name collision** with Tailwind numeric `duration-*` — mitigated by the
  build-passes acceptance gate + documented fallback.
- **Retrofit breadth** touches shared primitives (`button.tsx`) — visually
  verify hover states still transition normally for users *without* reduced
  motion (`motion-safe:` is a no-op there).
