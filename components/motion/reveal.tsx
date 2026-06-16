"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

type Phase = "initial" | "hidden" | "shown";

/**
 * Reveals a block with a subtle fade-up the first time it scrolls into view.
 *
 * Progressive enhancement: content is visible before JS and under reduced motion.
 * The IntersectionObserver decides POST-LAYOUT (its callback runs after the
 * browser has laid out the page), so — unlike a synchronous mount-time measurement —
 * it never mis-hides content that is actually on screen, even while images/fonts are
 * still settling. Above-fold blocks stay visible (no flash); below-fold blocks are
 * hidden off-screen on the first report, then fade up when they enter. opacity +
 * transform only — no layout shift; once-only.
 */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("initial");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A display:none block (e.g. an empty section collapsed by `empty:hidden`) can never
    // intersect — observing it would leak a never-disconnected observer and could strand it
    // at opacity-0 if it later gained content. Reveal it and skip the observer.
    const isHidden = getComputedStyle(el).display === "none";
    if (reduce || isHidden || typeof IntersectionObserver === "undefined") {
      setPhase("shown"); // visible immediately, no observer
      return;
    }

    let decided = false;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (entry.isIntersecting) {
        setPhase("shown"); // in view → fade up into place (or just stay, if already visible)
        io.disconnect();
      } else if (!decided) {
        setPhase("hidden"); // first post-layout report + off-screen → arm the reveal
      }
      decided = true;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        phase !== "initial" &&
          "motion-safe:transition-[opacity,transform] motion-safe:duration-slow motion-safe:ease-brand",
        phase === "hidden" ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
