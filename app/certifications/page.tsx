import { BackToHome } from "@/components/layout/back-to-home";
import { CertificationsGrid } from "@/components/sections/certifications-grid";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackToHome />
        <h1 className="text-2xl font-bold">All Certifications</h1>
      </div>
      <CertificationsGrid />
    </div>
  );
}
