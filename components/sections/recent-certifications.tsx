import Link from "next/link";
import { certifications } from "@/content/certifications";
import { Section } from "./section";
import { CertCard } from "./cert-card";
import { Award } from "lucide-react";

export const RECENT_CERTS_COUNT = 4;

export function RecentCertifications() {
  const slice = certifications.slice(0, RECENT_CERTS_COUNT);
  const hasMore = certifications.length > RECENT_CERTS_COUNT;
  return (
    <Section
      title="Recent Certifications"
      isEmpty={slice.length === 0}
      emptyIcon={<Award className="h-6 w-6" />}
      emptyHint={{ title: "No certifications", hint: "Edit content/certifications.ts." }}
      headerRight={
        hasMore ? (
          <Link
            href="/certifications"
            className="text-sm text-[hsl(var(--accent))] hover:underline whitespace-nowrap"
          >
            View All →
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slice.map((c, i) => (
          <CertCard key={i} cert={c} />
        ))}
      </div>
    </Section>
  );
}
