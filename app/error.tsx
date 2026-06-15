"use client";
import { BackToHome } from "@/components/layout/back-to-home";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="text-center py-24 space-y-4">
      <h1 className="text-[length:var(--text-display)] font-bold">Something went wrong</h1>
      <p className="text-[hsl(var(--muted-foreground))]">An unexpected error occurred. Try again or head back home.</p>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 h-10 text-sm hover:bg-[hsl(var(--muted))] motion-safe:transition-colors"
        >
          Try again
        </button>
        <BackToHome />
      </div>
    </div>
  );
}
