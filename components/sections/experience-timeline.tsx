import { experience } from "@/content/experience";
import { Section } from "./section";
import { Briefcase } from "lucide-react";

export function ExperienceTimeline() {
  return (
    <Section
      title="Experience"
      isEmpty={experience.length === 0}
      emptyIcon={<Briefcase className="h-6 w-6" />}
      emptyHint={{ title: "No experience entries", hint: "Edit content/experience.ts." }}
    >
      <ol className="relative space-y-3">
        {/* Vertical track behind the bullets.
            x: bullet column is 12px wide starting at OL left (0).
               Center of bullet = 6px = 0.375rem.
            y: starts near the first bullet's top (mt-1 = 4px), ends near
               the last bullet's bottom. top/bottom-2 (8px) approximates this. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[0.375rem] top-2 bottom-2 w-px bg-[hsl(var(--foreground))]/20"
        />
        {experience.map((e, i) => (
          <li key={i} className="group flex items-start gap-3">
            <span
              aria-hidden
              className="relative z-10 mt-1 h-3 w-3 rounded-sm border border-[hsl(var(--foreground))]/40 bg-[hsl(var(--card))] shrink-0 transition-colors group-hover:bg-[hsl(var(--foreground))]"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold">{e.title}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{e.org}</p>
            </div>
            <span className="mt-1 text-xs text-[hsl(var(--muted-foreground))] shrink-0">
              {e.year}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
