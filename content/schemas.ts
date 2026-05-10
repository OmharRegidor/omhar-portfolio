import { z } from "zod";

export const SocialSchema = z.object({
  label: z.enum(["LinkedIn", "GitHub", "X", "Instagram", "Facebook"]),
  url: z.string().url(),
});

export const FeaturedAwardSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
});

export const AccessCardSchema = z.object({
  label: z.string().min(1),
  subLabel: z.string().min(1),
  ownerName: z.string().min(1),
  role: z.string().min(1),
});

export const ProfileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  photoSrc: z.string().min(1),
  bioParagraphs: z.array(z.string().min(1)).min(1),
  socials: z.array(SocialSchema).default([]),
  calendlyUrl: z.string().url(),
  featuredAwards: z.array(FeaturedAwardSchema).default([]),
  accessCard: AccessCardSchema.optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters/digits, hyphens only between segments"),
  name: z.string().min(1),
  blurb: z.string().min(1).max(160),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
});
export const ProjectsSchema = z.array(ProjectSchema).min(1).refine(
  (arr) => new Set(arr.map((p) => p.slug)).size === arr.length,
  { message: "Project slugs must be unique" }
);
export type Project = z.infer<typeof ProjectSchema>;

export const ExperienceItemSchema = z.object({
  title: z.string().min(1),
  org: z.string().min(1),
  year: z.string().regex(/^\d{4}$/, "4-digit year"),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const CertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  url: z.string().url(),
});
export type Certification = z.infer<typeof CertificationSchema>;

export const TechStackSchema = z.record(z.string().min(1), z.array(z.string().min(1)));
export type TechStack = z.infer<typeof TechStackSchema>;

export const RecommendationSchema = z.object({
  quote: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const GalleryImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

export const MembershipSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});
export type Membership = z.infer<typeof MembershipSchema>;

export const MdxFrontmatterSchema = z.object({
  title: z.string().min(1),
  cover: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date YYYY-MM-DD"),
});
export type MdxFrontmatter = z.infer<typeof MdxFrontmatterSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
}).strict();
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
