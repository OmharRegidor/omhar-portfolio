import { ProjectsSchema, type Project } from "./schemas";

// Until real projects land here, the projects grid links to your GitHub.
// To add a real project: { slug: "my-app", name: "MyApp", blurb: "What it does", url: "https://..." }
// To add a case study: drop content/projects/<slug>.mdx with frontmatter { title, date }
const data: Project[] = [
  {
    slug: "github",
    name: "GitHub",
    blurb: "Browse all my open-source work and side projects.",
    url: "https://github.com/OmharRegidor",
  },
];

export const projects = ProjectsSchema.parse(data);
