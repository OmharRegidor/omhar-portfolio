import { certifications } from "@/content/certifications";
import { CertCard } from "./cert-card";

export function CertificationsGrid() {
  if (certifications.length === 0) {
    return process.env.NODE_ENV === "development" ? (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        No certifications — edit <code>content/certifications.ts</code>.
      </p>
    ) : null;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certifications.map((c, i) => (
        <CertCard key={i} cert={c} />
      ))}
    </div>
  );
}
