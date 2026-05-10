import { ProjectsSchema, type Project } from "./schemas";

// Order matters: first 4 surface on the homepage "Recent Projects" section.
// /projects renders the full list. Edit blurbs/order anytime.
const data: Project[] = [
  {
    slug: "noxa-loyalty",
    name: "Noxa Loyalty",
    blurb: "Customer loyalty rewards platform — web + iOS mobile app.",
    url: "https://www.noxaloyalty.com/",
  },
  {
    slug: "sweetblooms",
    name: "SweetBlooms",
    blurb: "Florist e-commerce with internal admin, staff, and manufacturing system.",
    url: "https://www.sweetblooms.ph/",
  },
  {
    slug: "jaza-media",
    name: "JAZA Media",
    blurb: "Media agency for scaling business operations and revenue.",
    url: "https://www.jazamedia.com/",
  },
  {
    slug: "crisia-va",
    name: "Crisia VA",
    blurb: "Virtual assistant for founders, creators, and small businesses.",
    url: "https://crisia-va-portfolio.vercel.app/",
  },
  {
    slug: "salespipe",
    name: "SalesPipe",
    blurb: "Sales pipeline and customer relationship tracker.",
    url: "https://pipeline-pal-17.vercel.app/",
  },
];

export const projects = ProjectsSchema.parse(data);
