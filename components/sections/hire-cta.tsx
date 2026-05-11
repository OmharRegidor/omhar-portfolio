import Link from "next/link";
import { profile } from "@/content/profile";
import { Code2 } from "lucide-react";

export function HireCta() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="inline-flex items-center gap-2 mb-2">
        <Code2 className="h-4 w-4" aria-hidden />
        <span className="font-semibold">Available for Hire</span>
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
        Open for client work — building custom systems and applications, from
        web platforms to AI-powered tooling.
      </p>
      <Link
        href={profile.calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
      >
        Let&apos;s talk →
      </Link>
    </div>
  );
}
