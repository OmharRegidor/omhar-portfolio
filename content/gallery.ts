import { z } from "zod";
import { GalleryImageSchema, type GalleryImage } from "./schemas";

const data: GalleryImage[] = [];

export const gallery = z.array(GalleryImageSchema).parse(data);
