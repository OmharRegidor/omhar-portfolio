import { projects } from "@/content/projects";
import { Section } from "./section";
import { ProjectCard } from "./project-card";
import { FolderGit2 } from "lucide-react";

export function ProjectsGrid() {
  return (
    <Section
      title="All Projects"
      isEmpty={projects.length === 0}
      emptyIcon={<FolderGit2 className="h-6 w-6" />}
      emptyHint={{ title: "No projects", hint: "Edit content/projects.ts." }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Section>
  );
}
