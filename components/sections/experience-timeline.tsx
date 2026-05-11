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
      <ol className="space-y-4">
        {experience.map((e, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-1 h-3 w-3 rounded-sm border border-[hsl(var(--foreground))]/40 shrink-0"
              aria-hidden
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
