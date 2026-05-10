import { BackToHome } from "@/components/layout/back-to-home";
import { ProjectsGrid } from "@/components/sections/projects-grid";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackToHome />
        <h1 className="text-2xl font-bold">All Projects</h1>
      </div>
      <ProjectsGrid />
    </div>
  );
}
