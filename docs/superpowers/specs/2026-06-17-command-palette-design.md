# Phase 2 — ⌘K Command Palette (quick-nav)

**Date:** 2026-06-17
**Status:** Approved (design) → ready for implementation
**Branch:** `phase2-command-palette`
**Phase:** 2 (Interactivity) — fourth feature on top of the motion foundation
**Depends on:** `2026-06-15-phase2-motion-design-system-design.md` (`motion-safe:`
convention, reduced-motion guard) and the existing Radix dialog wrapper
(`components/ui/dialog.tsx`).

## Goal

The site has **no nav bar**. Give visitors a fast, keyboard-first way to jump between the
site's pages: press **⌘K / Ctrl+K** (or click a visible **"Go to… ⌘K"** button) to open a
centered overlay, type to filter, arrow to choose, **Enter** to navigate.

Chosen direction (locked in brainstorm):
- **Scope:** **page navigation only** — the 5 routes (Home, Projects, Tech Stack,
  Certifications, Resume). No "open chat / toggle theme / copy email" commands in v1
  (deferred; adding one later = one line in the data file).
- **Open via:** keyboard (**⌘K** mac / **Ctrl+K** win-linux) **and** a visible trigger
  button labelled **"Go to… ⌘K"**. The button matters because ⌘K is invisible to mouse
  users and unusable on phones, and it is now the primary navigation affordance.
- **Trigger placement:** a **global fixed top-right controls cluster** — `[ Go to… ⌘K ]`
  pill next to the theme switch, on **every** page.
- **Filtering:** simple case-insensitive substring match + per-page keyword aliases. No
  fuzzy-match library.
- **Build:** hand-rolled on the **existing Radix `ui/dialog.tsx`** — no new dependency.

Non-negotiables (baked in):
- **Reduced motion** — reuse the dialog's `motion-safe:`-gated open/close animation; it
  already collapses under the global guard. No new keyframes.
- **Full keyboard a11y** — combobox/listbox semantics; focus trap, Escape, scroll-lock
  from Radix.
- **No new dependency / no CI-audit risk** — reuse what's installed.

Non-goals: content search (searching project/cert text), non-navigation commands
(chat/theme/email), fuzzy matching, recent/frequent history, nested command groups,
first-visit hint.

## Context (current state)

- **Routes:** `/` (home), `/projects`, `/tech-stack`, `/certifications`, `/resume`
  (`app/**/page.tsx`). Homepage sections already carry anchor ids but nothing links to
  them; **section-jump is out of scope** for v1 (page nav only).
- **No global keyboard shortcuts** exist. Scoped `keydown` handlers live only in
  `gallery.tsx`, `ui/carousel.tsx`, `chat/chat-panel.tsx`.
- **No nav bar / header.** Navigation is scattered `next/link`s ("View All →") + the
  `back-to-home` link on sub-pages.
- **Theme switch is homepage-only.** `ThemeSwitch` is rendered only inside `ProfileCard`
  (`components/hero/profile-card.tsx:13`, `absolute right-4 top-4 sm:right-6 sm:top-6`),
  which renders only on the homepage. **Sub-pages currently have no theme toggle** — this
  design fixes that by moving the switch into the global cluster.
- **Reusable primitives:** `components/ui/dialog.tsx` (Radix `Dialog` wrapper with
  overlay, `motion-safe:` `animate-in/fade-in-0/zoom-in-95` enter-states, built-in
  focus-trap / Escape / scroll-lock / sr-only title support), `components/ui/button.tsx`
  (variants + `motion-safe:transition-colors`), `cn()` at `lib/cn.ts`, `lucide-react`
  icons, `next-themes` (`useTheme().setTheme`), `next/navigation` `useRouter` +
  `usePathname`.
- **Layout** (`app/layout.tsx`) is a server component; `ThemeProvider` wraps
  `main`, `SiteFooter`, and the client `<ChatLauncher/>` mounted at root — the natural
  home for a sibling global control component.
- Available motion: `--motion-fast/base/slow` tokens, `ease-brand`, `motion-safe:`
  convention, the reduced-motion guard.

## Design

### 1. Data — `components/command-palette/nav-items.ts`

A single typed array; the only thing to edit when destinations change.

```ts
import type { LucideIcon } from "lucide-react";
import { Home, FolderGit2, Layers, Award, FileText } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[]; // aliases for the substring match
};

export const navItems: NavItem[] = [
  { label: "Home",           href: "/",               icon: Home,      keywords: ["start", "profile", "about"] },
  { label: "Projects",       href: "/projects",       icon: FolderGit2,keywords: ["work", "portfolio"] },
  { label: "Tech Stack",     href: "/tech-stack",     icon: Layers,    keywords: ["skills", "tools", "stack"] },
  { label: "Certifications", href: "/certifications", icon: Award,     keywords: ["certs", "credentials"] },
  { label: "Resume",         href: "/resume",         icon: FileText,  keywords: ["cv", "experience"] },
];
```

### 2. Filtering — `components/command-palette/filter.ts`

A pure, unit-testable helper (no React) so the ranking logic is isolated:

```ts
export function filterNavItems(items: NavItem[], query: string): NavItem[]
```
- Empty/whitespace query → return all items in declared order.
- Else lower-case the query; an item matches if its `label` **or** any `keyword`
  contains the query (`includes`).
- Rank: items whose `label` **startsWith** the query first, then other matches; stable
  within each group (declared order preserved).
- No matches → empty array (drives the empty state).

### 3. The palette — `components/command-palette/command-palette.tsx` (`"use client"`)

Built on the existing Radix dialog primitives. One clear job: render the controlled
overlay + input + list and handle in-palette keyboard nav.

**Props:** `{ open: boolean; onOpenChange: (open: boolean) => void }` (fully controlled
by `SiteControls`).

**Structure**
- `Dialog` (Radix, `open`/`onOpenChange`) → `DialogContent` sized for a palette
  (`max-w-lg`, top-anchored, padding 0). Includes an **sr-only `DialogTitle`** ("Go to
  page") — Radix requires a title for a11y.
- **Input row:** a search `<input>` (`role="combobox"`, `aria-expanded={true}`,
  `aria-controls={listId}`, `aria-activedescendant={highlighted option id}`),
  placeholder "Go to…", a leading search icon, and an `esc` hint chip.
- **List:** `<ul role="listbox" id={listId}>`; each item
  `<li role="option" id=… aria-selected={isHighlighted}>` with icon + label, the
  highlighted row styled with the accent, and a "↵" hint on the highlighted row. The
  **current route** (via `usePathname`) shows a subtle "current" marker.
- **Empty state:** when the filtered list is empty, render "No pages match" in the list
  area (no options).
- **Footer:** muted hints — `↑ ↓ Navigate · ↵ Open · esc Close`.

**State & behavior**
- Local state: `query` (string), `highlight` (index into the filtered list).
- `filtered = filterNavItems(navItems, query)`; `highlight` is clamped into range
  whenever `filtered` changes (reset to 0 on query change).
- **Auto-focus** the input when `open` becomes true (Radix `DialogContent` autofocus +
  explicit focus to be safe). **On close**, reset `query=""` and `highlight=0`.
- **Keydown on the input/content:**
  - `ArrowDown` / `ArrowUp` → move `highlight` with **wrap-around**; `preventDefault`.
  - `Enter` → if `filtered[highlight]` exists, `navigate(item)`; else no-op.
  - (Escape + outside-click handled by Radix.)
- **Mouse:** hovering a row sets `highlight`; click → `navigate(item)`.
- **navigate(item):** `onOpenChange(false)` then `router.push(item.href)`
  (`next/navigation`). Navigating to the current route just closes (push is a near no-op).

### 4. Global controls cluster — `components/layout/site-controls.tsx` (`"use client"`)

The fixed top-right cluster + the palette's owner.

- Renders, in a `fixed right-4 top-4 sm:right-6 sm:top-6 z-40` flex row:
  1. the **trigger pill** — a `ui/button` (`variant="outline" size="sm"`) showing a
     search icon + **"Go to…"** + a `⌘K` / `Ctrl K` kbd hint; `onClick` opens the
     palette. `aria-keyshortcuts="Meta+K Control+K"`, `aria-label="Go to page"`.
  2. the **`ThemeSwitch`** (moved here from `ProfileCard`).
- Owns `const [open, setOpen] = useState(false)` and renders
  `<CommandPalette open={open} onOpenChange={setOpen} />`.
- **Global shortcut:** a `useEffect` adds a `document` `keydown` listener; on
  `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"` → `preventDefault()` and
  **toggle** `open`. Cleanup removes the listener.
- **Platform-aware hint:** detect mac (`navigator.platform`/`userAgent`) in an effect to
  show `⌘K` vs `Ctrl K`; render a stable default first to avoid hydration mismatch, and
  use the `// eslint-disable-next-line react-hooks/set-state-in-effect` pattern from
  `theme-switch.tsx` (remove the directive if the rule doesn't fire).
- **z-index:** pill sits at `z-40` (above page content, below the Radix dialog overlay,
  which portals above). Chat launcher is bottom-right → no overlap.

### 5. Wire-up — touched files

- **`app/layout.tsx`** — add `<SiteControls />` next to `<ChatLauncher />` inside
  `ThemeProvider` (global, every page).
- **`components/hero/profile-card.tsx`** — **remove** the `<ThemeSwitch …/>` line and its
  import (now global). The card's other layout is unchanged.

### 6. Accessibility

- Combobox/listbox pattern as in §3 (`aria-activedescendant` drives SR focus without
  moving DOM focus off the input).
- Radix Dialog gives focus-trap, `aria-modal`, Escape, scroll-lock, restore-focus on
  close, and the sr-only title.
- Trigger button: real `<button>` with `aria-label` + `aria-keyshortcuts`; the kbd hint
  is `aria-hidden`.
- Moving `ThemeSwitch` global means it's now reachable by keyboard on every page.
- Reduced motion: covered by §7.

### 7. Motion

Reuse the dialog's existing `motion-safe:` `animate-in / fade-in-0 / zoom-in-95`
enter-states (already collapse to instant under the reduced-motion guard). Trigger pill
uses `ui/button`'s `motion-safe:transition-colors`. **No `globals.css` change, no new
keyframes.**

### 8. Testing (TDD, red→green)

1. **Unit — `tests/unit/filter.test.ts` (new):** empty query → all; substring match on
   label and on keyword alias (`cv` → Resume, `work` → Projects); `startsWith` ranked
   before `includes`; declared-order stability; no-match → `[]`.
2. **Unit — `tests/unit/command-palette.test.tsx` (new):** stub `next/navigation`
   (`useRouter().push`, `usePathname`). Renders all items when open; typing filters the
   list; `ArrowDown`/`ArrowUp` move + wrap the highlighted option (`aria-selected`);
   `Enter` calls `push(href)` and closes; click calls `push`; empty query state; empty
   "No pages match" state; combobox/listbox roles + `aria-activedescendant` present;
   current-route marker via mocked `usePathname`.
3. **Unit — `tests/unit/site-controls.test.tsx` (new):** ⌘K (`metaKey`) and Ctrl+K
   (`ctrlKey`) toggle the palette open/closed and `preventDefault`; trigger-pill click
   opens it; the `ThemeSwitch` renders inside the cluster.
4. **Unit — update `tests/unit/*` that assert `ThemeSwitch` lives in `ProfileCard`**
   (if any) to reflect the move.
5. **e2e — `tests/e2e/command-palette.spec.ts` (new):** open via the pill **and** via
   keyboard; type to filter; `Enter` navigates to the right URL; `Esc` closes;
   `reducedMotion: "reduce"` emulation (opens/works, no animation reliance); **mobile**
   viewport — the pill opens it (no ⌘K dependency).
6. Gates: `lint` · `tsc` · `test` · `build` · `e2e` all green.

## Acceptance criteria

- [ ] `⌘K` / `Ctrl+K` toggles the palette from anywhere; the **"Go to… ⌘K"** pill opens
      it on every page (incl. sub-pages and mobile).
- [ ] Typing filters the 5 pages (label + alias match, `startsWith` ranked first);
      no-match shows an empty state.
- [ ] `↑/↓` move the highlight (wrap-around); `Enter`/click navigates via
      `router.push`; `Esc`/outside-click/✕ close; query + highlight reset on close.
- [ ] Combobox/listbox a11y roles + `aria-activedescendant`; focus trap, Escape,
      scroll-lock (Radix); sr-only dialog title.
- [ ] `ThemeSwitch` is now in the global cluster and works on **every** page; removed
      from `ProfileCard`.
- [ ] Current route is marked in the list.
- [ ] Reduced motion → palette appears without animation; no new keyframes added.
- [ ] No new npm dependency added.
- [ ] Unit + e2e pass; `lint`, `tsc`, `test`, `build`, `e2e` all green.

## Risks

- **Trigger ↔ theme-switch overlap / homepage double-control** — eliminated by moving
  `ThemeSwitch` into the single global cluster (one source of truth), rather than adding a
  second top-right element.
- **Hydration mismatch on the ⌘K/Ctrl label** — mitigated by rendering a stable default
  on the server and resolving the platform in an effect.
- **`react-hooks/set-state-in-effect` lint** on the platform/effect state — use the
  disable-comment pattern from `theme-switch.tsx`; remove the directive if the rule
  doesn't fire (it warns when unused).
- **Global ⌘K hijack** — scoped to `(meta|ctrl)+k` with `preventDefault`; toggling
  (not just opening) keeps behavior predictable if pressed while open. Other dialogs
  (chat) stack via Radix; acceptable for v1.
- **`router.push` to the current route** — harmless (effectively a no-op); the palette
  just closes.
- **Sub-page layout** — sub-pages had no top-right control before; the fixed cluster is
  `position: fixed` and won't shift their content (verify no overlap with `back-to-home`
  at the top-left — different corner).
