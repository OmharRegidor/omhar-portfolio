import { z } from "zod";

export const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // RATE_LIMIT_BYPASS is read directly by lib/rate-limit.ts (intentional — see note there).
  // The AI provider keys (GROQ_API_KEY / GOOGLE_AI_API_KEY) and chat knobs are read
  // directly by lib/ai/config.ts for the same reason: getEnv() requires Upstash creds,
  // but a local dev with RATE_LIMIT_BYPASS=1 may not have them. Keeping them out of this
  // schema avoids coupling the chat to Upstash and the "validates but consumer ignores" smell.
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
