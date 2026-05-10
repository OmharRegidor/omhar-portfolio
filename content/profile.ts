import { ProfileSchema, type Profile } from "./schemas";

const data: Profile = {
  name: "Omhar Regidor",
  role: "Agentic Engineer & Web Developer",
  location: "Batangas, Philippines",
  photoSrc: "/omhar/me-pro-image.JPG",
  bioParagraphs: [
    "Omhar Regidor is a Web Developer and emerging Agentic Engineer passionate about building systems that combine software, automation, and AI-driven workflows. With experience in developing applications, managing technical operations, and leveraging modern AI tools, he focuses on creating scalable digital solutions that help businesses operate more efficiently and grow faster.",
    "Beyond traditional web development, Omhar is deeply interested in the future of autonomous systems and AI-powered execution. He continuously explores how intelligent agents, automation pipelines, and scalable infrastructures can transform startups and business operations. His mindset blends technical execution with strategic thinking, allowing him to bridge the gap between engineering and business growth.",
    "Currently, Omhar is evolving from being a developer into a systems-oriented technical leader — sharpening his skills in software architecture, AI-assisted development, and business systems design. His long-term vision is to become a high-level technology strategist capable of building impactful products, leading engineering teams, and creating scalable AI-powered ecosystems.",
  ],
  socials: [
    { label: "GitHub", url: "https://github.com/OmharRegidor" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/omhar-regidor-84827136a/" },
    { label: "Facebook", url: "https://www.facebook.com/christian.omhar.regidor" },
  ],
  calendlyUrl: "https://calendly.com/omharregidor/30min",
  // Featured awards intentionally empty — the rotator hides at length<=1.
  // Add real awards (hackathon wins, cert honors, etc.) here when they land.
  featuredAwards: [],
};

export const profile = ProfileSchema.parse(data);
