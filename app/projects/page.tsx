import { BackToHome } from "@/components/layout/back-to-home";
import { ProjectsGrid } from "@/components/sections/projects-grid";

export default function Page() {
  return (
    <div className="space-y-6">
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">All Projects</h1>
      <ProjectsGrid />
    </div>
  );
}
