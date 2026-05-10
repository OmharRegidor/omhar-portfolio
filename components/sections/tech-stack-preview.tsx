import Link from "next/link";
import { techStack } from "@/content/tech-stack";
import { Section } from "./section";
import { Code2 } from "lucide-react";

export const PREVIEW_CATEGORIES = 3;
export const PREVIEW_CHIPS = 6;

export function TechStackPreview() {
  const entries = Object.entries(techStack).slice(0, PREVIEW_CATEGORIES);
  const isEmpty = entries.length === 0;
  return (
    <Section
      title="Tech Stack"
      isEmpty={isEmpty}
      emptyIcon={<Code2 className="h-6 w-6" />}
      emptyHint={{ title: "Tech stack empty", hint: "Edit content/tech-stack.ts." }}
    >
      <div className="space-y-4">
        {entries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[length:var(--text-h3)] font-semibold mb-2">{cat}</h3>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, PREVIEW_CHIPS).map((t) => (
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
      <Link
        href="/tech-stack"
        className="mt-4 inline-block text-sm text-[hsl(var(--accent))] hover:underline"
      >
        View all →
      </Link>
    </Section>
  );
}
