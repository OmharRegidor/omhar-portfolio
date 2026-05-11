import { ProfileCard } from "@/components/hero/profile-card";
import { About } from "@/components/sections/about";
import { TechStackPreview } from "@/components/sections/tech-stack-preview";
import { RecentProjects } from "@/components/sections/recent-projects";
import { RecentCertifications } from "@/components/sections/recent-certifications";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { RecommendationsCarousel } from "@/components/sections/recommendations-carousel";
import { MembershipBlock } from "@/components/sections/membership-block";
import { PartnerCta } from "@/components/sections/partner-cta";
import { Gallery } from "@/components/sections/gallery";
import { SocialLinks } from "@/components/sections/social-links";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <ProfileCard />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-12">
          <About />
          <TechStackPreview />
          <RecentProjects />
          <RecentCertifications />
          {/* mt-auto pushes Social Links to the bottom of the column so its
              bottom edge aligns with the Gallery's bottom edge in the right
              column (grid items-stretch makes both columns the same height) */}
          <div className="mt-auto">
            <SocialLinks />
          </div>
        </div>
        <aside className="space-y-4">
          <ExperienceTimeline />
          <PartnerCta />
          <RecommendationsCarousel />
          <MembershipBlock />
          <Gallery />
        </aside>
      </div>
    </div>
  );
}
