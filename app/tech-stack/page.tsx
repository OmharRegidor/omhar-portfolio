import { BackToHome } from "@/components/layout/back-to-home";
import { TechStackFull } from "@/components/sections/tech-stack-full";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackToHome />
        <h1 className="text-2xl font-bold">Tech Stack</h1>
      </div>
      <TechStackFull />
    </div>
  );
}
