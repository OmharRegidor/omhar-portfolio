import { ProfileCard } from "@/components/hero/profile-card";
import { About } from "@/components/sections/about";
import { TechStackPreview } from "@/components/sections/tech-stack-preview";
import { RecentProjects } from "@/components/sections/recent-projects";
import { RecentCertifications } from "@/components/sections/recent-certifications";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { RecommendationsCarousel } from "@/components/sections/recommendations-carousel";
import { MembershipBlock } from "@/components/sections/membership-block";
import { SpeakingCta } from "@/components/sections/speaking-cta";
import { GalleryCarousel } from "@/components/sections/gallery-carousel";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <ProfileCard />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-12">
          <About />
          <TechStackPreview />
          <RecentProjects />
          <RecentCertifications />
        </div>
        <aside className="space-y-6">
          <ExperienceTimeline />
          <SpeakingCta />
          <MembershipBlock />
        </aside>
      </div>
      <RecommendationsCarousel />
      <GalleryCarousel />
    </div>
  );
}
