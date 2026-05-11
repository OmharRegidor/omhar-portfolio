import { z } from "zod";
import { GalleryImageSchema, type GalleryImage } from "./schemas";

// Drop more images in /public/omhar/gallery/ and add entries here.
const data: GalleryImage[] = [
  { src: "/omhar/gallery/gradpic-bsit-sign.jpg", alt: "BS IT graduation" },
  { src: "/omhar/gallery/capstone-pass.png", alt: "Capstone defense" },
  { src: "/omhar/gallery/coding-noxa-loyalty.jpg", alt: "Building Noxa Loyalty" },
  { src: "/omhar/gallery/shang-coding.png", alt: "Coding session" },
];

export const gallery = z.array(GalleryImageSchema).parse(data);
