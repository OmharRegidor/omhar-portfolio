import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "../content/projects";

const dir = join(process.cwd(), "content", "projects");
if (!existsSync(dir)) {
  console.log("No content/projects/ directory; skipping case-study validation.");
  process.exit(0);
}

const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
const slugs = new Set(projects.map((p) => p.slug));

const orphans: string[] = [];
for (const f of files) {
  const slug = f.replace(/\.mdx$/, "");
  if (!slugs.has(slug)) orphans.push(f);
}

if (orphans.length > 0) {
  console.error("MDX files without matching project slug:", orphans);
  process.exit(1);
}

const noCaseStudy = projects
  .map((p) => p.slug)
  .filter((s) => !files.includes(`${s}.mdx`));
if (noCaseStudy.length > 0) {
  console.log(`Projects without MDX case study (cards link external): ${noCaseStudy.join(", ")}`);
}

console.log(`OK ${files.length} case study/studies validated.`);
