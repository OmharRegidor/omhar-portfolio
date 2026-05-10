import { profile } from "../content/profile";

const PLACEHOLDERS: Array<[string, string]> = [
  [profile.name, "Owner Name"],
  [profile.role, "Software Engineer"],
  [profile.location, "City, Country"],
  [profile.calendlyUrl, "your-handle"],
];

const failures: string[] = [];
for (const [actual, placeholder] of PLACEHOLDERS) {
  if (actual.toLowerCase().includes(placeholder.toLowerCase())) {
    failures.push(`profile field still contains placeholder: "${placeholder}" (got "${actual}")`);
  }
}

const placeholderBio = "Replace this paragraph";
if (profile.bioParagraphs.some((p) => p.toLowerCase().includes(placeholderBio.toLowerCase()))) {
  failures.push(`profile.bioParagraphs still contains "${placeholderBio}..."`);
}

if (failures.length > 0) {
  console.error("Content placeholder check failed:");
  for (const f of failures) console.error(`  - ${f}`);
  console.error("Edit content/profile.ts before deploying.");
  process.exit(1);
}

console.log("OK Content placeholder check passed.");
