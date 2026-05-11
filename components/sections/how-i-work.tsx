import { Section } from "./section";

// EDIT ME: change these paragraphs to update the "How I work" section
// on the homepage. Each string is a separate paragraph.
const HOW_I_WORK_PARAGRAPHS = [
  "I treat every project as a partnership, not a transaction. From the first conversation, I focus on understanding your business — what you actually need to ship, who your customers are, and where you want to be in 12 months. Then I build for that.",
  "My stack ranges from rapid MVPs to production-grade systems with internal tooling. I write code that your future team can read, ship features that move metrics, and stay honest about what's not worth building.",
];

export function HowIWork() {
  return (
    <Section title="How I work" isEmpty={HOW_I_WORK_PARAGRAPHS.length === 0}>
      <div className="space-y-4 text-sm leading-relaxed text-[hsl(var(--foreground))]">
        {HOW_I_WORK_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}
