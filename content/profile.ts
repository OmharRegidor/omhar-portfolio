import { ProfileSchema, type Profile } from "./schemas";

const data: Profile = {
  name: "Owner Name",                                    // EDIT ME
  role: "Software Engineer",                             // EDIT ME
  location: "City, Country",                             // EDIT ME
  photoSrc: "/next.svg",                                 // EDIT ME — drop your own photo file in /public/ then update this path
  bioParagraphs: [
    "Replace this paragraph with a real bio.",           // EDIT ME
  ],
  socials: [],
  calendlyUrl: "https://calendly.com/your-handle/intro", // EDIT ME
  featuredAwards: [],
};

export const profile = ProfileSchema.parse(data);
