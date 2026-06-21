import type { LucideIcon } from "lucide-react";
import { Home, FolderGit2, Layers, Award, FileText } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home, keywords: ["start", "profile", "about"] },
  { label: "Projects", href: "/projects", icon: FolderGit2, keywords: ["work", "portfolio"] },
  { label: "Tech Stack", href: "/tech-stack", icon: Layers, keywords: ["skills", "tools", "stack"] },
  { label: "Certifications", href: "/certifications", icon: Award, keywords: ["certs", "credentials"] },
  { label: "Resume", href: "/resume", icon: FileText, keywords: ["cv", "experience"] },
];
