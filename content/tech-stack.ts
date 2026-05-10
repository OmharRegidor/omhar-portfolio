import { TechStackSchema, type TechStack } from "./schemas";

const data: TechStack = {
  "Frontend Foundations": ["HTML5", "CSS3", "JavaScript", "TypeScript"],
  "UI Frameworks & Styling": ["React", "React Native", "Next.js", "Tailwind CSS", "MUI"],
  "Backend & Runtime": ["Node.js", "Express.js", "JWT"],
  Databases: ["MySQL", "PostgreSQL", "MongoDB"],
  "Cloud, Hosting & BaaS": ["Supabase", "Vercel"],
  "DevOps & Tools": ["Git", "GitHub", "GitHub Actions", "Docker"],
  "APIs & Testing": ["Postman", "Twilio", "Jasmine", "ESLint"],
  "Design & Productivity": ["Figma", "Notion"],
};

export const techStack = TechStackSchema.parse(data);
