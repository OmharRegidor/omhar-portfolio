import { techStack } from "@/content/tech-stack";
import { Section } from "./section";
import { Code2 } from "lucide-react";

export function TechStackFull() {
  const entries = Object.entries(techStack);
  return (
    <Section
      title="Tech Stack"
      isEmpty={entries.length === 0}
      emptyIcon={<Code2 className="h-6 w-6" />}
      emptyHint={{ title: "Tech stack empty", hint: "Edit content/tech-stack.ts." }}
    >
      <div className="space-y-6">
        {entries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[length:var(--text-h3)] font-semibold mb-2">{cat}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-[hsl(var(--muted))] px-2.5 py-1 text-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
