import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

// Hard guard: bypass MUST NEVER be active in production. Module-load assertion.
if (process.env.RATE_LIMIT_BYPASS === "1" && process.env.NODE_ENV === "production") {
  throw new Error("RATE_LIMIT_BYPASS=1 is forbidden in production. Refusing to start.");
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
