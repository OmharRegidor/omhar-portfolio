import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";
import { techStack } from "@/content/tech-stack";
import { certifications } from "@/content/certifications";
import { recommendations } from "@/content/recommendations";

/** Rough token estimate (~4 chars/token) — good enough for budget guards. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

let cached: string | null = null;

/**
 * Serialize the entire portfolio into a compact, XML-tagged knowledge block.
 * The KB is tiny and static, so it is stuffed wholesale into the system prompt —
 * no RAG, no embeddings, no vector DB. This is the bot's ONLY source of truth.
 *
 * Note: the phone number is intentionally omitted — the bot routes contact intent
 * to Calendly/email rather than handing out a personal number.
 */
export function buildKnowledgeBlock(): string {
  if (cached) return cached;

  const lines: string[] = [];

  lines.push("<profile>");
  lines.push(`Name: ${profile.name}`);
  lines.push(`Role: ${profile.role}`);
  lines.push(`Location: ${profile.location}`);
  for (const p of profile.bioParagraphs) lines.push(`Bio: ${p}`);
  lines.push("</profile>");

  lines.push("<contact>");
  lines.push(`Preferred — book a 30-min call on Calendly: ${profile.calendlyUrl}`);
  if (profile.email) lines.push(`Email: ${profile.email}`);
  for (const s of profile.socials) lines.push(`${s.label}: ${s.url}`);
  lines.push("</contact>");

  lines.push("<projects>");
  for (const p of projects) {
    const tags = p.tags?.length ? ` [${p.tags.join(", ")}]` : "";
    lines.push(`- ${p.name}: ${p.blurb} (${p.url})${tags}`);
  }
  lines.push("</projects>");

  lines.push("<experience>");
  for (const e of experience) lines.push(`- ${e.year}: ${e.title} @ ${e.org}`);
  lines.push("</experience>");

  lines.push("<tech_stack>");
  for (const [category, items] of Object.entries(techStack)) {
    lines.push(`${category}: ${items.join(", ")}`);
  }
  lines.push("</tech_stack>");

  if (certifications.length > 0) {
    lines.push("<certifications>");
    for (const c of certifications) lines.push(`- ${c.name} — ${c.issuer} (${c.url})`);
    lines.push("</certifications>");
  }

  if (recommendations.length > 0) {
    lines.push("<recommendations>");
    for (const r of recommendations) lines.push(`- "${r.quote}" — ${r.name}, ${r.title}`);
    lines.push("</recommendations>");
  }

  cached = lines.join("\n");
  return cached;
}
