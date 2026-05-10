import { BackToHome } from "@/components/layout/back-to-home";
import { TechStackFull } from "@/components/sections/tech-stack-full";

export default function Page() {
  return (
    <div className="space-y-6">
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">Tech Stack</h1>
      <TechStackFull />
    </div>
  );
}
