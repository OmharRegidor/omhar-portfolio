import { z } from "zod";

export const SocialSchema = z.object({
  label: z.enum(["LinkedIn", "GitHub", "X", "Instagram", "Facebook"]),
  url: z.string().url(),
});

export const FeaturedAwardSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
});


export const ProfileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  photoSrc: z.string().min(1),
  bioParagraphs: z.array(z.string().min(1)).min(1),
  socials: z.array(SocialSchema).default([]),
  calendlyUrl: z.string().url(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  featuredAwards: z.array(FeaturedAwardSchema).default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters/digits, hyphens only between segments");

export const ProjectSchema = z.object({
  slug,
  name: z.string().min(1),
  blurb: z.string().min(1).max(220),
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
});
export const ProjectsSchema = z.array(ProjectSchema).min(1).refine(
  (arr) => new Set(arr.map((p) => p.slug)).size === arr.length,
  { message: "Project slugs must be unique" }
);
export type Project = z.infer<typeof ProjectSchema>;

// The n8n workflows shown on /automations. Only facts already on the site go
// here: the chat repeats them, so anything added becomes something it says.
export const AutomationSchema = z.object({
  slug,
  name: z.string().min(1),
  /** Apps and services the workflow connects. */
  tools: z.array(z.string().min(1)).min(1),
  /** Plain sentences on how it works. */
  howItWorks: z.array(z.string().min(1)).min(1),
  /** Where a person stays in charge. */
  humanInTheLoop: z.string().min(1),
  /** Site path of its section on the automations page. */
  page: z.string().regex(/^\/automations#auto-[a-z0-9-]+$/, "an /automations#auto-... path"),
});
export const AutomationsSchema = z.object({
  /** What n8n is, in plain words. */
  platform: z.object({ name: z.string().min(1), about: z.string().min(1) }),
  workflows: z.array(AutomationSchema).min(1).refine(
    (arr) => new Set(arr.map((a) => a.slug)).size === arr.length,
    { message: "Automation slugs must be unique" }
  ),
});
export type Automations = z.infer<typeof AutomationsSchema>;

export const GearItemSchema = z.object({
  /** What it is for him, e.g. "Main machine". */
  role: z.string().min(1),
  name: z.string().min(1),
});
export const GearSchema = z.object({
  page: z.string().regex(/^\/[a-z0-9-]*$/, "a site path like /gear"),
  items: z.array(GearItemSchema).min(1),
});
export type Gear = z.infer<typeof GearSchema>;

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

// v2: multi-turn chat. The client sends the recent thread; the server bounds it.
// Roles are limited to user/assistant — the system prompt is assembled server-side
// and must never be injectable by the client.
export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000).trim(),
}).strict();
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchemaV2 = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(8),
}).strict();
export type ChatRequestV2 = z.infer<typeof ChatRequestSchemaV2>;

// Live demo on the CS Live Inbox page. The email is untrusted and only ever
// reaches a model wrapped in delimiters (lib/demo/inbox.ts).
export const InboxDemoRequestSchema = z.object({
  email: z.string().trim().min(1).max(1500),
}).strict();
export type InboxDemoRequest = z.infer<typeof InboxDemoRequestSchema>;
