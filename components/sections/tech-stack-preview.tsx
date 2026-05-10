import Link from "next/link";
import { techStack } from "@/content/tech-stack";
import { Section } from "./section";
import { Code2 } from "lucide-react";

export const PREVIEW_CATEGORIES = 3;
export const PREVIEW_CHIPS = 6;

export function TechStackPreview() {
  const allEntries = Object.entries(techStack);
  const entries = allEntries.slice(0, PREVIEW_CATEGORIES);
  const isEmpty = entries.length === 0;
  const hasMore = allEntries.length > PREVIEW_CATEGORIES;
  return (
    <Section
      title="Tech Stack"
      isEmpty={isEmpty}
      emptyIcon={<Code2 className="h-6 w-6" />}
      emptyHint={{ title: "Tech stack empty", hint: "Edit content/tech-stack.ts." }}
      headerRight={
        hasMore ? (
          <Link
            href="/tech-stack"
            className="text-sm text-[hsl(var(--accent))] hover:underline whitespace-nowrap"
          >
            View All →
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {entries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-sm font-semibold mb-2">{cat}</h3>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, PREVIEW_CHIPS).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-[hsl(var(--border))] px-2 py-0.5 text-xs"
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
