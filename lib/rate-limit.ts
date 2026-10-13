import { Ratelimit } from "@upstash/ratelimit";
import {
  getUpstash,
  markUpstashDown,
  noteMemoryFallback,
  upstashUsable,
  withDeadline,
} from "./upstash";

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

/** Per-IP budget, shared by the Upstash limiter and the in-memory fallback. */
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Upper bound on IPs tracked in memory, so a flood of new IPs can't grow it forever. */
const MAX_TRACKED_IDS = 10_000;

const BYPASS_RESULT = {
  success: true,
  limit: 10,
  remaining: 10,
  reset: 0,
} as const;

interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the oldest counted request leaves the window. */
  reset: number;
}

interface LimiterShape {
  limit(identifier: string): Promise<LimitResult>;
}

/**
 * Per-instance sliding window: at most `max` requests per `windowMs` for each
 * identifier, counted from the exact request times. Rejected requests are not
 * counted (same as the Upstash sliding window).
 */
export function createMemoryLimiter(
  max = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
): LimiterShape {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [id, times] of hits) {
      if (now - times[times.length - 1]! >= windowMs) hits.delete(id);
    }
    // Still too many live entries: drop the oldest-inserted ones.
    for (const id of hits.keys()) {
      if (hits.size <= MAX_TRACKED_IDS) break;
      hits.delete(id);
    }
  }

  return {
    async limit(id) {
      const now = Date.now();
      const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
      const success = recent.length < max;
      if (success) recent.push(now);
      hits.set(id, recent);
      if (hits.size > MAX_TRACKED_IDS) prune(now);
      return {
        success,
        limit: max,
        remaining: Math.max(0, max - recent.length),
        reset: recent[0]! + windowMs,
      };
    },
  };
}

let cached: LimiterShape | null = null;

/**
 * The per-IP limiter. Upstash when it answers within the deadline, otherwise
 * the in-memory sliding window (same 10 per minute), so an Upstash outage is
 * fast and still limited instead of slow and open. Never throws.
 */
export function getRateLimit(): LimiterShape {
  if (cached) return cached;

  if (process.env.RATE_LIMIT_BYPASS === "1") {
    cached = { limit: async () => BYPASS_RESULT };
    return cached;
  }

  const memory = createMemoryLimiter();
  const redis = getUpstash();
  if (!redis) {
    noteMemoryFallback("not configured");
    cached = memory;
    return cached;
  }

  const real = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, "1 m"),
    analytics: false,
    prefix: "@portfolio/chat",
    // 0 turns off the library's own "allow after 5 s" fail-open. The deadline
    // below handles slowness, and the memory limiter handles the rest.
    timeout: 0,
  });
  cached = {
    limit: async (id) => {
      if (upstashUsable()) {
        try {
          const r = await withDeadline(real.limit(id));
          return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
        } catch (e) {
          markUpstashDown(e);
        }
      }
      return memory.limit(id);
    },
  };
  return cached;
}
