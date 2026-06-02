import { ProjectsSchema, type Project } from "./schemas";

// Order matters: first 4 surface on the homepage "Recent Projects" section.
// /projects renders the full list. Cards link directly to the project URL.
const data: Project[] = [
  {
    slug: "binukbok-viewpoint",
    name: "BiNuKBoK View Point Resort",
    blurb:
      "Full-stack resort booking site + admin dashboard featuring an AI assistant that answers live availability and guest-arrival questions from the database. Online reservations, availability calendar, and QR-code check-in.",
    url: "http://www.binukbok-viewpoint.vercel.app",
  },
  {
    slug: "noxa-loyalty",
    name: "Noxa Loyalty",
    blurb:
      "Customer loyalty rewards platform — web app plus an iOS app on the App Store for end customers to track points and redeem rewards.",
    url: "https://www.noxaloyalty.com/",
  },
  {
    slug: "sweetblooms",
    name: "SweetBlooms",
    blurb:
      "Florist e-commerce with an internal sales/inventory system and POS that tracks operations and prevents leaks.",
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
