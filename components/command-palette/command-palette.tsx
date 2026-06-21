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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight(0);
  }, [query]);

  // Closing → clear the query + highlight for next open.
  React.useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
            aria-expanded={open}
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
            <li role="presentation" className="px-3 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
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
