import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] motion-safe:transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Home
    </Link>
  );
}
