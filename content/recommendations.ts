import { z } from "zod";
import { RecommendationSchema, type Recommendation } from "./schemas";

const data: Recommendation[] = [];

export const recommendations = z.array(RecommendationSchema).parse(data);
