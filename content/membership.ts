import { z } from "zod";
import { MembershipSchema, type Membership } from "./schemas";

const data: Membership[] = [];

export const membership = z.array(MembershipSchema).parse(data);
