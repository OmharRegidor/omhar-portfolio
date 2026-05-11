import Link from "next/link";
import { profile } from "@/content/profile";
import { Handshake } from "lucide-react";

export function PartnerCta() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="inline-flex items-center gap-2 mb-2">
        <Handshake className="h-4 w-4" aria-hidden />
        <span className="font-semibold">Partner with me</span>
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
        Open to partnering with founders and teams to design, build, and scale
        software — from MVPs and SaaS platforms to AI-powered tooling for
        growing businesses.
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
