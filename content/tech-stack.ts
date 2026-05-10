import { TechStackSchema, type TechStack } from "./schemas";

const data: TechStack = {};

export const techStack = TechStackSchema.parse(data);
