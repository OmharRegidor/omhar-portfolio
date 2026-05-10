import { BackToHome } from "@/components/layout/back-to-home";
import { CertificationsGrid } from "@/components/sections/certifications-grid";

export default function Page() {
  return (
    <div className="space-y-6">
      <BackToHome />
      <h1 className="text-[length:var(--text-display)] font-bold">All Certifications</h1>
      <CertificationsGrid />
    </div>
  );
}
