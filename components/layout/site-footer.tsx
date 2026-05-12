import { profile } from "@/content/profile";

export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-6 print:hidden">
      <p className="mx-auto max-w-4xl px-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
      </p>
    </footer>
  );
}
