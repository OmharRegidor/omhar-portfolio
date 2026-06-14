"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes hydration guard — a one-time mount flag is the documented pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // First-paint placeholder so layout doesn't shift while next-themes hydrates.
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex h-6 w-11 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <SwitchPrimitive.Root
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "border border-[hsl(var(--border))]",
        "bg-[hsl(var(--muted))] data-[state=checked]:bg-[hsl(var(--muted))]",
        "transition-colors",
        className,
      )}
    >
      {/* Track icons (always visible, thumb covers whichever is active) */}
      <Sun className="absolute left-1 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" aria-hidden />
      <Moon className="absolute right-1 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" aria-hidden />
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-[hsl(var(--card))]",
          "shadow-[0_1px_2px_hsl(0_0%_0%_/_0.2)]",
          "translate-x-0.5 transition-transform data-[state=checked]:translate-x-[calc(2.75rem-1.25rem-0.125rem)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
