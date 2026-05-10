import { profile } from "@/content/profile";
import { Section } from "./section";
import { FileText } from "lucide-react";

export function About() {
  const isEmpty = profile.bioParagraphs.length === 0;
  return (
    <Section
      title="About"
      isEmpty={isEmpty}
      emptyIcon={<FileText className="h-6 w-6" />}
      emptyHint={{ title: "Bio missing", hint: "Edit content/profile.ts → bioParagraphs[]." }}
    >
      <div className="space-y-4 text-sm leading-relaxed text-[hsl(var(--foreground))]">
        {profile.bioParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}
