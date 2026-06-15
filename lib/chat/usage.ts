import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";
import { getChatConfig } from "@/lib/ai/config";

/**
 * Global daily request ceiling — a cost circuit-breaker on top of the per-IP
 * rate limit. Counts all chat requests per UTC day in Upstash; once CHAT_DAILY_CAP
 * is hit, callers degrade to the static reply. FAILS OPEN: a counter outage must
 * never take the chat down (the per-IP limiter still bounds abuse).
 */
let redis: Redis | null = null;

function getRedis(): Redis {
  if (redis) return redis;
  const env = getEnv();
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

export async function allowDailyUsage(): Promise<boolean> {
  const cap = getChatConfig().dailyCap;
  if (!Number.isFinite(cap) || cap <= 0) return true;

  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = `@portfolio/chat:day:${day}`;
    const count = await getRedis().incr(key);
    if (count === 1) await getRedis().expire(key, 60 * 60 * 26); // ~26h TTL
    return count <= cap;
  } catch {
    return true; // fail-open
  }
}
