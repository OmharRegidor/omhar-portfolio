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
      <ol className="space-y-3 border-l-2 border-[hsl(var(--border))] pl-4">
        {experience.map((e, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full bg-[hsl(var(--accent))]"
              aria-hidden
            />
            <h3 className="font-semibold">{e.title}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {e.org} · {e.year}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
