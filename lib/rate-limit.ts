import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

// Hard guard: bypass MUST NEVER be active on the live (Vercel) deployment.
// Module-load assertion. Reads process.env directly (not getEnv()) because getEnv()
// requires Upstash creds which the bypass user explicitly doesn't have. The schema
// in env.ts validates shape; this guard validates intent.
//
// Scoped to `VERCEL` (set by Vercel at BOTH build and runtime, on production AND
// preview deploys) so every internet-facing deployment is protected — while CI/e2e
// and local production builds, which are not internet-facing and have no real
// Upstash, may legitimately use the bypass.
if (
  process.env.RATE_LIMIT_BYPASS === "1" &&
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL
) {
  throw new Error("RATE_LIMIT_BYPASS=1 is forbidden on the live deployment. Refusing to start.");
}

const BYPASS_RESULT = {
  success: true,
  limit: 10,
  remaining: 10,
  reset: 0,
} as const;

interface LimiterShape {
  limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
}

let cached: LimiterShape | null = null;

export function getRateLimit(): LimiterShape {
  if (cached) return cached;

  if (process.env.RATE_LIMIT_BYPASS === "1") {
    cached = { limit: async () => BYPASS_RESULT };
    return cached;
  }

  const env = getEnv();
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  const real = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
    prefix: "@portfolio/chat",
  });
  cached = {
    limit: async (id) => {
      const r = await real.limit(id);
      return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
    },
  };
  return cached;
}
