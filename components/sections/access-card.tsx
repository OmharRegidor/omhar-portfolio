import { profile } from "@/content/profile";
import { Terminal } from "lucide-react";

export function AccessCard() {
  if (!profile.accessCard) return null;
  const c = profile.accessCard;
  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 font-mono text-sm">
      <Terminal className="h-5 w-5 mb-2 text-[hsl(var(--muted-foreground))]" aria-hidden />
      <p className="text-[hsl(var(--foreground))] font-bold">{c.label}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.subLabel}</p>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          {c.subLabel}
        </p>
        <p className="font-bold">{c.ownerName}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.role}</p>
      </div>
    </div>
  );
}
