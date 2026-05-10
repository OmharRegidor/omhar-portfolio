import Link from "next/link";
import type { Project } from "@/content/schemas";

export function ProjectCard({ project }: { project: Project }) {
  const internal = project.caseStudy;
  const href = internal ? `/projects/${project.slug}` : project.url;
  const external = !internal;
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:bg-[hsl(var(--muted))] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold group-hover:text-[hsl(var(--accent))] transition-colors">{project.name}</h3>
        {internal && (
          <span className="rounded-md bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-xs text-[hsl(var(--accent))] whitespace-nowrap">
            Case study
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{project.blurb}</p>
      <p className="mt-2 font-mono text-xs text-[hsl(var(--muted-foreground))]">
        {new URL(project.url).host}
      </p>
    </Link>
  );
}
