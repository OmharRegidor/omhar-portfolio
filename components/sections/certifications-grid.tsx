import { certifications } from "@/content/certifications";
import { Section } from "./section";
import { CertCard } from "./cert-card";
import { Award } from "lucide-react";

export function CertificationsGrid() {
  return (
    <Section
      title="All Certifications"
      isEmpty={certifications.length === 0}
      emptyIcon={<Award className="h-6 w-6" />}
      emptyHint={{ title: "No certifications", hint: "Edit content/certifications.ts." }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((c, i) => (
          <CertCard key={i} cert={c} />
        ))}
      </div>
    </Section>
  );
}
