import Link from "next/link";
import type { Certification } from "@/content/schemas";

export function CertCard({ cert }: { cert: Certification }) {
  return (
    <Link
      href={cert.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:bg-[hsl(var(--muted))] transition-colors"
    >
      <h3 className="text-[length:var(--text-h3)] font-semibold">{cert.name}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{cert.issuer}</p>
    </Link>
  );
}
