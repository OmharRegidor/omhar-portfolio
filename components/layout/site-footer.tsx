import Link from "next/link";
import { Github, Linkedin, Facebook } from "lucide-react";
import { profile } from "@/content/profile";

const ICONS = {
  GitHub: Github,
  LinkedIn: Linkedin,
  Facebook: Facebook,
  X: Github, // fallback — not currently used
  Instagram: Github, // fallback — not currently used
} as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-6">
      <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        {profile.socials.length > 0 && (
          <ul className="flex items-center gap-4">
            {profile.socials.map((s) => {
              const Icon = ICONS[s.label];
              return (
                <li key={s.label}>
                  <Link
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${profile.name} on ${s.label}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </footer>
  );
}
