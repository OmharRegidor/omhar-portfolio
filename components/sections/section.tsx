import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

const isDev = process.env.NODE_ENV === "development";

interface SectionProps {
  title: string;
  isEmpty: boolean;
  emptyHint?: { title: string; hint: string };
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export function Section({ title, isEmpty, emptyHint, emptyIcon, children }: SectionProps) {
  const id = `section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  if (isEmpty) {
    if (!isDev || !emptyHint) return null;
    return (
      <section aria-labelledby={id}>
        <h2 id={id} className="sr-only">
          {title}
        </h2>
        <EmptyState icon={emptyIcon} title={emptyHint.title} hint={emptyHint.hint} />
      </section>
    );
  }

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-[length:var(--text-h2)] font-bold mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
