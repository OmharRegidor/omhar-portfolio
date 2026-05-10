import Link from "next/link";
import { profile } from "@/content/profile";
import { Mic } from "lucide-react";

export function SpeakingCta() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="inline-flex items-center gap-2 mb-2">
        <Mic className="h-4 w-4" aria-hidden />
        <span className="font-semibold">Speaking</span>
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
        Available for speaking at events about software development and emerging technologies.
      </p>
      <Link
        href={profile.calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
      >
        Get in touch →
      </Link>
    </div>
  );
}
