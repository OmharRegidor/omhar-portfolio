import { z } from "zod";
import { ExperienceItemSchema, type ExperienceItem } from "./schemas";

const data: ExperienceItem[] = [];

export const experience = z.array(ExperienceItemSchema).parse(data);
