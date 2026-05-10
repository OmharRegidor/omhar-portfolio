import { projects } from "../content/projects";
import { caseStudies } from "../content/case-studies";

// Cross-check the manifest in content/case-studies.ts against
// projects.ts caseStudy: true entries. Both must agree.

const manifestSlugs = new Set(Object.keys(caseStudies));
const projectsWithCaseStudy = projects.filter((p) => p.caseStudy).map((p) => p.slug);

const missing = projectsWithCaseStudy.filter((slug) => !manifestSlugs.has(slug));
const orphans = [...manifestSlugs].filter(
  (slug) => !projectsWithCaseStudy.includes(slug),
);

if (missing.length > 0) {
  console.error(
    "Project entries marked caseStudy:true but missing from content/case-studies.ts:",
    missing,
  );
  process.exit(1);
}
if (orphans.length > 0) {
  console.error(
    "Entries in content/case-studies.ts without a corresponding caseStudy:true project in projects.ts:",
    orphans,
  );
  process.exit(1);
}

console.log(`OK ${manifestSlugs.size} case study/studies validated.`);
