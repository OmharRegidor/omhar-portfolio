import type { ReactNode } from "react";

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center">
      {icon && (
        <div aria-hidden className="text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      )}
      <p className="font-semibold text-[hsl(var(--foreground))]">{title}</p>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{hint}</p>
    </div>
  );
}
