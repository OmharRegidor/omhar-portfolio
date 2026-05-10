import { projects } from "@/content/projects";
import { ProjectCard } from "./project-card";

export function ProjectsGrid() {
  if (projects.length === 0) {
    return process.env.NODE_ENV === "development" ? (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        No projects — edit <code>content/projects.ts</code>.
      </p>
    ) : null;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => (
        <ProjectCard key={p.slug} project={p} />
      ))}
    </div>
  );
}
