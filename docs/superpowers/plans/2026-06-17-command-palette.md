# ⌘K Command Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a keyboard-first quick-nav overlay (⌘K / Ctrl+K, plus a visible "Go to… ⌘K" button) that jumps between the site's 5 pages.

**Architecture:** A pure filter helper + a small data list drive a `CommandPalette` built on the existing Radix `ui/dialog.tsx`. A global client `SiteControls` component (mounted in `app/layout.tsx` beside `ChatLauncher`) owns the open-state, registers the global ⌘K listener, and renders a fixed top-right cluster: the trigger pill + the theme switch (moved out of `ProfileCard`, which also gives sub-pages a theme toggle).

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · `@radix-ui/react-dialog` · `lucide-react` · `next-themes` · Vitest + Testing Library · Playwright.

**Spec:** `docs/superpowers/specs/2026-06-17-command-palette-design.md`

## Global Constraints

- **No new npm dependency** — reuse what's installed (Radix dialog, lucide-react). (CI runs `pnpm audit --audit-level=high`.)
- **No new motion / keyframes** — reuse the dialog's existing `motion-safe:` open/close animation; gate any new transition with `motion-safe:`.
- **Scope is page navigation only** — the 5 routes `/`, `/projects`, `/tech-stack`, `/certifications`, `/resume`. No chat/theme/email commands.
- **TypeScript strict**, with `noUncheckedIndexedAccess: true` (array access is `T | undefined` — guard it) and `noUnusedLocals`/`noUnusedParameters: true` (remove every unused import/var).
- **Package manager: pnpm.** Path alias `@/*` → repo root.
- **Commits:** clean Conventional Commits, **no `Co-Authored-By` trailer**. Work stays on branch `phase2-command-palette`.
- **Gates (must stay green):** `pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm test` · `pnpm build` · `pnpm e2e`.

---

### Task 1: Nav data + filter logic

**Files:**
- Create: `components/command-palette/nav-items.ts`
- Create: `components/command-palette/filter.ts`
- Test: `tests/unit/filter.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type NavItem = { label: string; href: string; icon: import("lucide-react").LucideIcon; keywords?: string[] }`
  - `navItems: NavItem[]` (the 5 pages, in display order)
  - `filterNavItems(items: NavItem[], query: string): NavItem[]` — empty/whitespace query → all items in order; otherwise items whose `label` or any `keyword` contains the (lower-cased) query, ranked `label.startsWith` first then other matches, stable within each group.

- [ ] **Step 1: Write the data file** (no test of its own; exercised via the filter test)

Create `components/command-palette/nav-items.ts`:

```ts
import type { LucideIcon } from "lucide-react";
import { Home, FolderGit2, Layers, Award, FileText } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home, keywords: ["start", "profile", "about"] },
  { label: "Projects", href: "/projects", icon: FolderGit2, keywords: ["work", "portfolio"] },
  { label: "Tech Stack", href: "/tech-stack", icon: Layers, keywords: ["skills", "tools", "stack"] },
  { label: "Certifications", href: "/certifications", icon: Award, keywords: ["certs", "credentials"] },
  { label: "Resume", href: "/resume", icon: FileText, keywords: ["cv", "experience"] },
];
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/filter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Home } from "lucide-react";
import { filterNavItems, type NavItem } from "@/components/command-palette/filter";
import { navItems } from "@/components/command-palette/nav-items";

describe("filterNavItems", () => {
  it("returns all items for an empty or whitespace query", () => {
    expect(filterNavItems(navItems, "")).toHaveLength(navItems.length);
    expect(filterNavItems(navItems, "   ")).toHaveLength(navItems.length);
  });

  it("matches by label substring, case-insensitively", () => {
    expect(filterNavItems(navItems, "TECH").map((i) => i.href)).toEqual(["/tech-stack"]);
  });

  it("matches by keyword alias", () => {
    expect(filterNavItems(navItems, "cv").map((i) => i.href)).toEqual(["/resume"]);
    expect(filterNavItems(navItems, "work").map((i) => i.href)).toEqual(["/projects"]);
  });

  it("ranks label startsWith above contains/keyword matches", () => {
    const items: NavItem[] = [
      { label: "Beta Alpha", href: "/b", icon: Home }, // contains "alpha"
      { label: "Alpha", href: "/a", icon: Home }, // starts with "alpha"
    ];
    expect(filterNavItems(items, "alpha").map((i) => i.href)).toEqual(["/a", "/b"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterNavItems(navItems, "zzz")).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/unit/filter.test.ts`
Expected: FAIL — cannot resolve `@/components/command-palette/filter` (module not created yet).

- [ ] **Step 4: Write the filter implementation**

Create `components/command-palette/filter.ts`:

```ts
import type { NavItem } from "./nav-items";

export type { NavItem };

export function filterNavItems(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const starts: NavItem[] = [];
  const contains: NavItem[] = [];

  for (const item of items) {
    const label = item.label.toLowerCase();
    if (label.startsWith(q)) {
      starts.push(item);
    } else if (label.includes(q) || (item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false)) {
      contains.push(item);
    }
  }

  return [...starts, ...contains];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test tests/unit/filter.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add components/command-palette/nav-items.ts components/command-palette/filter.ts tests/unit/filter.test.ts
git commit -m "feat(palette): nav-items data + filter logic"
```

---

### Task 2: CommandPalette component

**Files:**
- Create: `components/command-palette/command-palette.tsx`
- Test: `tests/unit/command-palette.test.tsx`

**Interfaces:**
- Consumes: `navItems`, `filterNavItems` (Task 1); `Dialog`, `DialogContent`, `DialogTitle` from `@/components/ui/dialog`; `useRouter`, `usePathname` from `next/navigation`.
- Produces: `CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void })` — a controlled Radix Dialog overlay with a combobox input, a filtered listbox, arrow/Enter keyboard nav, click-to-navigate, an empty state, and a current-route marker.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/command-palette.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/projects",
}));

import { CommandPalette } from "@/components/command-palette/command-palette";
import { navItems } from "@/components/command-palette/nav-items";

beforeEach(() => push.mockClear());

const renderOpen = () => render(<CommandPalette open onOpenChange={() => {}} />);

describe("CommandPalette", () => {
  it("lists every page when opened with an empty query", () => {
    renderOpen();
    expect(screen.getAllByRole("option")).toHaveLength(navItems.length);
  });

  it("exposes combobox + listbox semantics with an active descendant", () => {
    renderOpen();
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-controls");
    expect(combobox).toHaveAttribute("aria-activedescendant");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("filters the list as the visitor types", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.type(screen.getByRole("combobox"), "cv");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Resume");
  });

  it("navigates to the highlighted page on Enter", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Enter}"); // highlight 0 = Home
    expect(push).toHaveBeenCalledWith("/");
  });

  it("moves the highlight with arrow keys before navigating", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}"); // 0 -> 1 = Projects
    expect(push).toHaveBeenCalledWith("/projects");
  });

  it("navigates on click", async () => {
    const user = userEvent.setup();
    renderOpen();
    await user.click(screen.getByText("Tech Stack"));
    expect(push).toHaveBeenCalledWith("/tech-stack");
  });

  it("shows an empty state and does not navigate on Enter when nothing matches", async () => {
    const user = userEvent.setup();
    renderOpen();
    const combobox = screen.getByRole("combobox");
    await user.type(combobox, "zzz");
    expect(screen.getByText(/no pages match/i)).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(push).not.toHaveBeenCalled();
  });

  it("marks the current route (usePathname = /projects)", () => {
    renderOpen();
    const projects = screen.getByText("Projects").closest('[role="option"]');
    expect(projects).toHaveTextContent(/current/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/command-palette.test.tsx`
Expected: FAIL — cannot resolve `@/components/command-palette/command-palette`.

- [ ] **Step 3: Write the component**

Create `components/command-palette/command-palette.tsx`:

```tsx
"use client";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";
import { filterNavItems } from "./filter";

const LIST_ID = "command-palette-list";
const optionId = (index: number) => `command-palette-option-${index}`;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);

  const results = React.useMemo(() => filterNavItems(navItems, query), [query]);

  // New query → reset the highlight to the first result.
  React.useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Closing → clear the query + highlight for next open.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  const navigate = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[highlight];
      if (item) navigate(item.href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Go to page</DialogTitle>

        {/* Input row (pr-10 keeps text clear of the dialog's built-in ✕) */}
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-4">
          <Search className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden />
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={results[highlight] ? optionId(highlight) : undefined}
            aria-label="Go to page"
            placeholder="Go to…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-12 w-full bg-transparent pr-10 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          />
        </div>

        {/* Results */}
        <ul id={LIST_ID} role="listbox" aria-label="Pages" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No pages match
            </li>
          ) : (
            results.map((item, index) => {
              const isActive = index === highlight;
              const isCurrent = item.href === pathname;
              const Icon = item.icon;
              return (
                <li
                  key={item.href}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm",
                    isActive
                      ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {isCurrent ? (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">current</span>
                  ) : (
                    isActive && (
                      <span aria-hidden className="text-xs text-[hsl(var(--muted-foreground))]">
                        ↵
                      </span>
                    )
                  )}
                </li>
              );
            })
          )}
        </ul>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-[hsl(var(--border))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span>↑ ↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/command-palette.test.tsx`
Expected: PASS (8 tests). If `autoFocus`/Radix focus causes an arrow/Enter test to act on the wrong element, the `await user.click(combobox)` already focuses it — keep that click before `user.keyboard`.

- [ ] **Step 5: Commit**

```bash
git add components/command-palette/command-palette.tsx tests/unit/command-palette.test.tsx
git commit -m "feat(palette): command palette overlay with filter + keyboard nav"
```

---

### Task 3: SiteControls (global cluster + ⌘K listener)

**Files:**
- Create: `components/layout/site-controls.tsx`
- Test: `tests/unit/site-controls.test.tsx`

**Interfaces:**
- Consumes: `CommandPalette` (Task 2); `Button` from `@/components/ui/button`; `ThemeSwitch` from `@/components/theme/theme-switch`.
- Produces: `SiteControls()` — a client component rendering a fixed top-right cluster (trigger pill + theme switch) and the `CommandPalette`; owns `open` state; a `document` `keydown` listener toggles it on `(meta|ctrl)+k`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/site-controls.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));

import { SiteControls } from "@/components/layout/site-controls";

describe("SiteControls", () => {
  it("renders the trigger pill and the theme switch", () => {
    render(<SiteControls />);
    expect(screen.getByRole("button", { name: "Go to page" })).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("opens the palette when the pill is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteControls />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page" }));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("toggles the palette with Cmd+K and Ctrl+K", () => {
    render(<SiteControls />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/site-controls.test.tsx`
Expected: FAIL — cannot resolve `@/components/layout/site-controls`.

- [ ] **Step 3: Write the component**

Create `components/layout/site-controls.tsx`:

```tsx
"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { CommandPalette } from "@/components/command-palette/command-palette";

export function SiteControls() {
  const [open, setOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  // Resolve the platform after mount: SSR + first client paint render "Ctrl K"
  // (default), then correct to "⌘K" on Mac — so hydration markup matches.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    const ua = `${navigator.platform} ${navigator.userAgent}`;
    setIsMac(/mac/i.test(ua));
  }, []);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 sm:right-6 sm:top-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="Go to page"
          aria-keyshortcuts="Meta+K Control+K"
          className="gap-2"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span>Go to…</span>
          <span aria-hidden className="text-xs text-[hsl(var(--muted-foreground))]">
            {isMac ? "⌘K" : "Ctrl K"}
          </span>
        </Button>
        <ThemeSwitch />
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/site-controls.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint the new files (catch the set-state-in-effect rule early)**

Run: `pnpm lint`
Expected: clean. If ESLint reports the `react-hooks/set-state-in-effect` directive is **unused**, delete that one comment line and re-run (per the project's documented quirk); if the rule *does* fire, the directive stays.

- [ ] **Step 6: Commit**

```bash
git add components/layout/site-controls.tsx tests/unit/site-controls.test.tsx
git commit -m "feat(palette): global SiteControls cluster + Cmd/Ctrl+K toggle"
```

---

### Task 4: Wire into the app (mount globally, move ThemeSwitch)

**Files:**
- Modify: `app/layout.tsx` (add `<SiteControls />` beside `<ChatLauncher />`)
- Modify: `components/hero/profile-card.tsx` (remove the now-duplicate `ThemeSwitch`)

**Interfaces:**
- Consumes: `SiteControls` (Task 3).
- Produces: a globally-mounted control cluster on every page; `ThemeSwitch` no longer rendered inside `ProfileCard`.

- [ ] **Step 1: Mount `SiteControls` in the layout**

In `app/layout.tsx`, add the import near the other component imports (after the `ChatLauncher` import on line 5):

```tsx
import { ChatLauncher } from '@/components/chat/chat-launcher';
import { SiteControls } from '@/components/layout/site-controls';
```

And render it inside `ThemeProvider`, right after `<ChatLauncher />`:

```tsx
        <ThemeProvider>
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
          <SiteFooter />
          <ChatLauncher />
          <SiteControls />
        </ThemeProvider>
```

- [ ] **Step 2: Remove the duplicate ThemeSwitch from ProfileCard**

In `components/hero/profile-card.tsx`:
- Delete the import line: `import { ThemeSwitch } from "@/components/theme/theme-switch";`
- Delete the JSX block (lines 12–13):

```tsx
      {/* Theme switch top-right */}
      <ThemeSwitch className="absolute right-4 top-4 sm:right-6 sm:top-6" />
```

Leave the rest of the file unchanged. (Removing the unused import is required — `noUnusedLocals` will otherwise fail `tsc`.)

- [ ] **Step 3: Type-check and lint**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.
Run: `pnpm lint`
Expected: clean (no unused `ThemeSwitch` import remaining).

- [ ] **Step 4: Run the full unit suite (no regressions)**

Run: `pnpm test`
Expected: PASS, including the three new files from Tasks 1–3.

- [ ] **Step 5: Build, then run the affected existing e2e (regression check)**

Run: `pnpm build`
Expected: build succeeds.
Run: `pnpm e2e tests/e2e/theme.spec.ts tests/e2e/a11y.spec.ts`
Expected: PASS. `theme.spec.ts` still finds the switch via `aria-label*="Switch to light"` (now in the global cluster, the only one on the page); `a11y.spec.ts` finds zero serious/critical violations (the trigger has an `aria-label`). If `theme.spec.ts` fails with a strict-mode "two elements" error, a `ThemeSwitch` is still rendered somewhere else — confirm Step 2 removed it from `ProfileCard`.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/hero/profile-card.tsx
git commit -m "feat(palette): mount SiteControls globally; move theme switch out of ProfileCard"
```

---

### Task 5: End-to-end coverage

**Files:**
- Create: `tests/e2e/command-palette.spec.ts`

**Interfaces:**
- Consumes: the wired-up app (Task 4). Playwright `baseURL` is `http://localhost:3000`; the e2e `webServer` runs `pnpm build && pnpm start`.

- [ ] **Step 1: Write the e2e spec**

Create `tests/e2e/command-palette.spec.ts`:

```ts
import { test, expect, type Page } from "@playwright/test";

/**
 * ⌘K command palette — quick-nav overlay.
 * See docs/superpowers/specs/2026-06-17-command-palette-design.md.
 * The trigger button and the combobox both have the accessible name "Go to page";
 * the role disambiguates them.
 */
const trigger = (page: Page) => page.getByRole("button", { name: "Go to page" });
const palette = (page: Page) => page.getByRole("combobox", { name: "Go to page" });

test("opens via the trigger button, filters, and navigates", async ({ page }) => {
  await page.goto("/");
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();

  await palette(page).fill("proj");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
});

test("opens with the Ctrl+K shortcut and closes with Escape", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
});

test("works under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();
});

test("is usable on mobile via the visible trigger (no keyboard shortcut)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await expect(trigger(page)).toBeVisible();
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e spec**

Run: `pnpm e2e tests/e2e/command-palette.spec.ts`
Expected: PASS (4 tests). (First run builds + starts the app via the configured `webServer`.)

- [ ] **Step 3: Full gate sweep**

Run, in order:
```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
pnpm e2e
```
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/command-palette.spec.ts
git commit -m "test(palette): e2e coverage (keyboard + pill, filter, navigate, reduced-motion, mobile)"
```

---

## Self-Review

**1. Spec coverage** (each spec section → task):
- Data `nav-items.ts` → Task 1 ✓ · Filtering `filter.ts` → Task 1 ✓
- Palette overlay / input / list / empty state / keyboard / current-route → Task 2 ✓
- Global cluster, trigger pill, ⌘K listener, platform label → Task 3 ✓
- Mount in layout + remove ThemeSwitch from ProfileCard (fixes sub-page theme toggle) → Task 4 ✓
- A11y (combobox/listbox, aria-activedescendant, sr-only title) → Task 2 ✓ · trigger `aria-keyshortcuts`/label → Task 3 ✓
- Motion reuse / no new keyframes → no `globals.css` change in any task ✓
- Tests: filter, palette, site-controls unit + e2e (keyboard, pill, filter, navigate, Esc, reduced-motion, mobile) → Tasks 1,2,3,5 ✓ · existing theme/a11y regression → Task 4 ✓
- No new dependency → only `react`, `next`, `lucide-react`, existing `ui/*` imports ✓
- Acceptance criteria all map to the above ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step has complete code and exact commands. ✓

**3. Type consistency:** `NavItem`, `navItems`, `filterNavItems(items, query)` defined in Task 1 and consumed with identical names/signatures in Tasks 2–3. `CommandPalette({open, onOpenChange})` produced in Task 2, consumed in Task 3. `SiteControls()` produced in Task 3, consumed in Task 4. `LIST_ID`/`optionId` are internal to Task 2. Array access (`results[highlight]`) is guarded for `noUncheckedIndexedAccess`. ✓

No gaps found.
