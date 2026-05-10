import Link from "next/link";
import { projects } from "@/content/projects";
import { Section } from "./section";
import { ProjectCard } from "./project-card";
import { FolderGit2 } from "lucide-react";

export const RECENT_PROJECTS_COUNT = 4;

export function RecentProjects() {
  const slice = projects.slice(0, RECENT_PROJECTS_COUNT);
  const hasMore = projects.length > RECENT_PROJECTS_COUNT;
  return (
    <Section
      title="Recent Projects"
      isEmpty={slice.length === 0}
      emptyIcon={<FolderGit2 className="h-6 w-6" />}
      emptyHint={{ title: "No projects", hint: "Edit content/projects.ts." }}
      headerRight={
        hasMore ? (
          <Link
            href="/projects"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline whitespace-nowrap"
          >
            View All →
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slice.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Section>
  );
}
