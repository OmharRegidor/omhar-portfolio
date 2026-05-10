import Link from "next/link";
import type { Project } from "@/content/schemas";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:bg-[hsl(var(--muted))] transition-colors"
    >
      <h3 className="text-sm font-semibold group-hover:text-[hsl(var(--accent))] transition-colors">
        {project.name}
      </h3>
      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{project.blurb}</p>
      <p className="mt-2 font-mono text-xs text-[hsl(var(--muted-foreground))]">
        {new URL(project.url).host}
      </p>
    </Link>
  );
}
