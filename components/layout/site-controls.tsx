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
  React.useEffect(() => {
    const ua = `${navigator.platform} ${navigator.userAgent}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
