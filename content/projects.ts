import { ProjectsSchema, type Project } from "./schemas";

// Order matters: first 4 surface on the homepage "Recent Projects" section.
// /projects renders the full list. Cards link directly to the project URL.
const data: Project[] = [
  {
    slug: "documentary-generator",
    name: "Documentary Generator",
    blurb:
      "Web app that turns a script and a voiceover into a finished 1080p documentary. AI plans the scenes, finds the pictures, makes the cuts and mixes the sound. Sign-in required.",
    url: "https://v2202610431966533958.ultrasrv.de/",
  },
  {
    slug: "agad",
    name: "Agad",
    blurb:
      "Startup application that watches onlinejobs.ph for new jobs, writes a ready-to-paste application with AI, and sends it to the user's own Gmail so they can apply first.",
    url: "https://applyfirst.tail1fc6ab.ts.net/",
  },
  {
    slug: "binukbok-viewpoint",
    name: "BiNuKBoK View Point Resort",
    blurb:
      "Full-stack resort booking site + admin dashboard featuring an AI assistant that answers live availability and guest-arrival questions from the database. Online reservations, availability calendar, and QR-code check-in.",
    url: "https://binukbok-viewpoint.vercel.app",
  },
  {
    slug: "noxa-loyalty",
    name: "Noxa Loyalty",
    blurb:
      "Customer loyalty rewards platform — web app plus iOS (App Store) and Android apps for end customers to track points and redeem rewards.",
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
  {
    slug: "hera-bathroom",
    name: "HERA Bathroom",
    blurb:
      "Website design for a Singapore bathtub and vanity brand, with its store built in Shopify. Showcases freestanding bathtubs and lets visitors book a site visit or shop the range.",
    url: "https://www.herabathroom.com/",
  },
  {
    slug: "hera-athena",
    name: "HERA ATHENA",
    blurb:
      "Product page built in Shopify for ATHENA, HERA's modular bathroom vanity system, where buyers choose the size, storage, top, mirror and finish.",
    url: "https://store.herabathroom.com/pages/athena",
  },
];

export const projects = ProjectsSchema.parse(data);
