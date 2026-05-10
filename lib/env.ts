import { z } from "zod";

export const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // RATE_LIMIT_BYPASS is read directly by lib/rate-limit.ts (intentional — see note there).
  // Removed from this schema to avoid a "schema validates but consumer ignores" drift smell.
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  cached = parsed.data;
  return cached;
}
