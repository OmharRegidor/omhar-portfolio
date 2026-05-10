import Link from "next/link";
import { membership } from "@/content/membership";
import { Section } from "./section";
import { Users } from "lucide-react";

export function MembershipBlock() {
  return (
    <Section
      title="A member of"
      isEmpty={membership.length === 0}
      emptyIcon={<Users className="h-6 w-6" />}
      emptyHint={{ title: "No memberships", hint: "Edit content/membership.ts." }}
    >
      <ul className="space-y-2">
        {membership.map((m, i) => (
          <li key={i}>
            <Link
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
            >
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
