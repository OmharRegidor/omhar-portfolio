import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { profile } from "@/content/profile";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/70">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {profile.name}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
