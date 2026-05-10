"use client";
import { useState } from "react";
import type { z } from "zod";
import type { FeaturedAwardSchema } from "@/content/schemas";
import { Trophy, ChevronRight } from "lucide-react";

type Award = z.infer<typeof FeaturedAwardSchema>;

export function FeaturedAward({ awards }: { awards: Award[] }) {
  const [i, setI] = useState(0);
  if (awards.length === 0) return null;
  const current = awards[i]!;
  const showNext = awards.length > 1;
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-3 py-1.5 text-sm text-[hsl(var(--accent-foreground))]">
      <Trophy className="h-4 w-4" aria-hidden />
      {current.url ? (
        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium"
        >
          {current.title}
        </a>
      ) : (
        <span className="font-medium">{current.title}</span>
      )}
      {showNext && (
        <button
          type="button"
          aria-label="Next award"
          onClick={() => setI((n) => (n + 1) % awards.length)}
          className="ml-2 rounded-full bg-[hsl(var(--accent-foreground))]/20 p-1 motion-safe:transition-transform motion-safe:hover:translate-x-0.5"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
