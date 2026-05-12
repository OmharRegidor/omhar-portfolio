"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-sm bg-[hsl(var(--foreground))] px-3 py-2 text-sm font-medium text-[hsl(var(--background))] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Print / Save as PDF
    </button>
  );
}
