import Link from "next/link";
import { Github, Linkedin, Facebook } from "lucide-react";
import { profile } from "@/content/profile";
import { Section } from "./section";

const ICONS = {
  GitHub: Github,
  LinkedIn: Linkedin,
  Facebook: Facebook,
  X: Github,
  Instagram: Github,
} as const;

export function SocialLinks() {
  if (profile.socials.length === 0) return null;
  return (
    <Section title="Social Links" isEmpty={false}>
      <ul className="flex flex-wrap items-center gap-3">
        {profile.socials.map((s) => {
          const Icon = ICONS[s.label];
          return (
            <li key={s.label}>
              <Link
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] motion-safe:transition-colors"
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{s.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
