import { TechStackSchema, type TechStack } from "./schemas";

const data: TechStack = {
  "AI Tools": ["Claude Code", "Agent Team", "Lovable", "v0", "Google Stitch"],
  "Cloud, Hosting & BaaS": ["Supabase", "Vercel"],
  "UI Frameworks & Styling": ["React", "React Native", "Next.js", "Tailwind CSS", "MUI"],
  "Frontend Foundations": ["HTML5", "CSS3", "JavaScript", "TypeScript"],
  "Backend & Runtime": ["Node.js", "Express.js", "JWT"],
  Databases: ["MySQL", "PostgreSQL", "MongoDB"],
  "DevOps & Tools": ["Git", "GitHub", "GitHub Actions", "Docker"],
  "APIs & Testing": ["Postman", "Twilio", "Jasmine", "ESLint"],
  "Design & Productivity": ["Figma", "Notion"],
};

export const techStack = TechStackSchema.parse(data);
