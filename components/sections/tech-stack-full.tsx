import { techStack } from "@/content/tech-stack";

export function TechStackFull() {
  const entries = Object.entries(techStack);
  if (entries.length === 0) {
    return process.env.NODE_ENV === "development" ? (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Tech stack empty — edit <code>content/tech-stack.ts</code>.
      </p>
    ) : null;
  }
  return (
    <div className="space-y-6">
      {entries.map(([cat, items]) => (
        <div key={cat}>
          <h2 className="text-sm font-semibold mb-2">{cat}</h2>
          <div className="flex flex-wrap gap-2">
            {items.map((t) => (
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
  );
}
