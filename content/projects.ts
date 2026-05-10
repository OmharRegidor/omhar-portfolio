import { ProjectsSchema, type Project } from "./schemas";

const data: Project[] = [
  { slug: "first-project", name: "First Project", blurb: "Replace with real blurb.", url: "https://example.com" },
];

export const projects = ProjectsSchema.parse(data);
