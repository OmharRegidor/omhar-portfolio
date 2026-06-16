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
import { Reveal } from "@/components/motion/reveal";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <ProfileCard />
      {/*
        Mobile (< md): outer is `flex flex-col` and the two column wrappers use
        `display: contents` so all items become direct flex children — `order-N`
        then interleaves left/right items into the requested mobile sequence.
        md+ : outer switches to grid, wrappers switch to flex-col, restoring
        the two-column desktop layout with its per-item margins.
      */}
      <div className="flex flex-col gap-y-12 md:grid md:grid-cols-[1fr_320px] md:gap-x-8 md:gap-y-0">
        <div className="contents md:flex md:flex-col">
          <Reveal className="order-1 md:order-none"><About /></Reveal>
          <Reveal className="order-3 md:order-none md:mt-12"><TechStackPreview /></Reveal>
          <Reveal className="order-4 md:order-none md:mt-6"><RecentProjects /></Reveal>
          <Reveal className="order-9 md:order-none md:mt-12 empty:hidden"><RecentCertifications /></Reveal>
          <Reveal className="order-7 md:order-none md:mt-auto md:pt-2"><SocialLinks /></Reveal>
        </div>
        <div className="contents md:flex md:flex-col md:gap-y-4">
          <Reveal className="order-2 md:order-none"><ExperienceTimeline /></Reveal>
          <Reveal className="order-6 md:order-none"><PartnerCta /></Reveal>
          <Reveal className="order-5 md:order-none"><RecommendationsCarousel /></Reveal>
          <Reveal className="order-10 md:order-none empty:hidden"><MembershipBlock /></Reveal>
          <Reveal className="order-8 md:order-none"><Gallery /></Reveal>
        </div>
      </div>
    </div>
  );
}
