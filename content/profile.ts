import { ProfileSchema, type Profile } from "./schemas";

const data: Profile = {
  name: "Owner Name",                                    // EDIT ME
  role: "Software Engineer",                             // EDIT ME
  location: "City, Country",                             // EDIT ME
  photoSrc: "/profile.jpg",                              // EDIT ME — drop file in /public/
  bioParagraphs: [
    "Replace this paragraph with a real bio.",           // EDIT ME
  ],
  socials: [],
  calendlyUrl: "https://calendly.com/your-handle/intro", // EDIT ME
  featuredAwards: [],
};

export const profile = ProfileSchema.parse(data);
