import { z } from "zod";
import { CertificationSchema, type Certification } from "./schemas";

const data: Certification[] = [];

export const certifications = z.array(CertificationSchema).parse(data);
