import { ProjectsSchema, type Project } from "./schemas";

// Order matters: first 5 surface on the homepage "Recent Projects" section.
// /projects renders the full list. Edit blurbs/order anytime.
//
// Set caseStudy: true when you've authored a matching content/projects/<slug>.mdx
// file. The card will get a "Case study" badge and link to /projects/<slug>
// instead of the external URL.
const data: Project[] = [
  {
    slug: "noxa-loyalty",
    name: "Noxa Loyalty",
    blurb: "Customer loyalty rewards platform — web + iOS mobile app.",
    url: "https://www.noxaloyalty.com/",
    caseStudy: true,
  },
  {
    slug: "sweetblooms",
    name: "SweetBlooms",
    blurb: "Florist e-commerce with internal admin, staff, and manufacturing system.",
    url: "https://www.sweetblooms.ph/",
    caseStudy: true,
  },
  {
    slug: "jaza-media",
    name: "JAZA Media",
    blurb: "Media agency for scaling business operations and revenue.",
    url: "https://www.jazamedia.com/",
    caseStudy: false,
  },
  {
    slug: "crisia-va",
    name: "Crisia VA",
    blurb: "Virtual assistant for founders, creators, and small businesses.",
    url: "https://crisia-va-portfolio.vercel.app/",
    caseStudy: false,
  },
  {
    slug: "salespipe",
    name: "SalesPipe",
    blurb: "Sales pipeline and customer relationship tracker.",
    url: "https://pipeline-pal-17.vercel.app/",
    caseStudy: false,
  },
];

export const projects = ProjectsSchema.parse(data);
