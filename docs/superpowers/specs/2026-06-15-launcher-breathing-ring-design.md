# Phase 2 — Chat Launcher Breathing Ring

**Date:** 2026-06-15
**Status:** Approved (design) → ready for implementation
**Branch:** `phase2-launcher-breathing-ring`
**Phase:** 2 (Interactivity) — first feature on top of the motion foundation
**Depends on:** `2026-06-15-phase2-motion-design-system-design.md` (tokens + `motion-safe:` + reduced-motion guard)

## Goal

Make the "Ask Omhar AI" chat launcher gently invite attention with a subtle,
breathing accent ring. It breathes continuously (a gentle loop) and never
animates for visitors who prefer reduced motion.

Chosen direction (validated live in the visual companion):
- **Form:** keep the pill with the "Ask Omhar AI" label + chat icon (variant D).
- **Effect:** a thin accent ring around the pill that breathes (scales + fades).
- **Trigger:** always breathing — a continuous gentle loop while the launcher is visible.
- **Intensity:** subtle/premium — slow cadence, low opacity, small scale.

Non-goals: changing the chat panel, the launcher's position/label/icon, or adding
a notification/badge. Just the ring + its lifecycle.

## Context (current state)

- `components/chat/chat-launcher.tsx` — a `"use client"` component: a single
  `<button>` pill (`fixed bottom-6 right-6 z-30`, `rounded-full`, card bg, border,
  elevated shadow, `hover:bg-[hsl(var(--muted))] motion-safe:transition-colors`,
  `print:hidden`) with a `MessageSquare` icon + "Ask Omhar AI" label, that opens
  `ChatPanel` via local `open` state.
- Motion foundation (already on `main`): `--ease-brand`, duration tokens, the
  `motion-safe:` convention, and the global `prefers-reduced-motion` reset.
- `chat-panel.tsx` already persists per-tab state in `sessionStorage`
  (`omhar-chat-v1`) — the same storage mechanism this feature reuses.

## Design

### 1. Breathing animation token — `app/globals.css` `@theme`

Tailwind v4 turns `--animate-*` into the `animate-breathe` utility; the keyframes
live in `@theme` so they're only emitted when used:

```css
--animate-breathe: breathe 3.5s ease-in-out infinite;
@keyframes breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.85; transform: scale(1.08); }
}
```

`ease-in-out` (symmetric) is correct for a breathe — not the brand ease-out.
Values are deliberately subtle (opacity 0.4→0.85, scale ≤1.08, 3.5s) and will be
fine-tuned live in the running app.

### 2. The ring element — `chat-launcher.tsx`

An `aria-hidden`, `pointer-events-none` sibling rendered behind the button, sized
~4px outside it and matching its pill shape:

```tsx
<span
  aria-hidden
  className="pointer-events-none absolute -inset-1 rounded-full border border-[hsl(var(--accent))] opacity-0 motion-safe:animate-breathe"
/>
```

**Reduced-motion is handled by construction:** base class is `opacity-0`; only the
`motion-safe:animate-breathe` animation makes it visible (the keyframes drive
opacity). So under `prefers-reduced-motion: reduce` the animation never applies
and the ring stays fully invisible — no stuck static ring. Under normal motion it
fades in and breathes. (The global guard would also neutralize it; this makes the
intent explicit.)

### 3. Structure (wrap, don't rewrite)

The `fixed bottom-6 right-6 z-30 print:hidden` positioning moves to a wrapping
`relative` container; the button keeps its current classes plus `relative z-10`;
the ring is the absolutely-positioned sibling. Because the ring sits *outside* the
button's edge and is `pointer-events-none`, it never blocks clicks. Label, icon,
hover transition, and `ChatPanel` wiring are unchanged.

```tsx
<div className="fixed bottom-6 right-6 z-30 print:hidden">
  <button type="button" onClick={() => setOpen(true)} aria-label="Ask Omhar AI"
          className="relative z-10 inline-flex items-center gap-2 rounded-full …">
    <MessageSquare className="h-4 w-4" aria-hidden />
    <span>Ask Omhar AI</span>
  </button>
  <span aria-hidden className="… motion-safe:animate-breathe" />
</div>
<ChatPanel open={open} onOpenChange={setOpen} />
```

### 4. Lifecycle — always on (no state)

The ring is rendered unconditionally and animates continuously; there is no
`breathing` state, mount effect, or sessionStorage. SSR-safe by construction —
server and client render the same static `<span>`, and `opacity-0` keeps it
invisible until the (motion-safe) animation drives opacity, so no hydration
flash. The button's only job is `setOpen(true)`.

> **Revised 2026-06-15:** originally "breathe until first open, then stop"
> (sessionStorage `omhar-chat-launcher-seen`). Changed to a continuous gentle
> loop after live testing — stopping after the first open meant the owner and
> returning visitors almost never saw it. Reduced-motion still suppresses it.

### 5. Testing

1. **Unit (RTL, `tests/unit/chat-launcher.test.tsx` — new):**
   - The ring (`[aria-hidden]` with the `animate-breathe` class, `pointer-events-none`)
     always renders.
   - It keeps breathing after the chat is opened (clicking the button does not
     remove it).
   - (matchMedia is stubbed by `vitest.setup.ts`; assert on class presence, not
     computed animation.)
2. **Static:** extend `tests/unit/motion-tokens.test.ts` to assert
   `--animate-breathe` and `@keyframes breathe` exist in `globals.css`.
3. **Existing reduced-motion e2e** already samples the launcher; the ring is
   invisible under reduce by construction, so no new e2e is required.

## Acceptance criteria

- [ ] `--animate-breathe` + `@keyframes breathe` present in `globals.css` `@theme`.
- [ ] Launcher shows a subtle breathing accent ring continuously.
- [ ] Ring keeps breathing after the chat is opened (no stop/dismiss).
- [ ] Ring is fully invisible under `prefers-reduced-motion: reduce`.
- [ ] No hydration warning; label/icon/position/hover unchanged; clicks unaffected.
- [ ] Unit + static tests pass; `lint`, `tsc`, `test`, `build`, `e2e` all green.

## Risks

- **Hydration flash** — mitigated by starting `breathing=false` and enabling it in a
  mount effect (server and first paint agree).
- **Ring clipping** — the wrapper must not set `overflow:hidden`; the ring extends
  outside via `-inset-1` and scales to 1.08. Verify visually at the corner.
- **Z-order / click-through** — ring is `pointer-events-none` and outside the button
  face; button is `relative z-10`. Verify the button stays fully clickable.
