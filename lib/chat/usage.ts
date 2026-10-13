import { getChatConfig } from "@/lib/ai/config";
import {
  getUpstash,
  markUpstashDown,
  noteMemoryFallback,
  upstashUsable,
  withDeadline,
} from "@/lib/upstash";

/**
 * Global daily request ceiling, a cost circuit-breaker on top of the per-IP
 * rate limit. Counts all AI requests (chat and inbox demo) per UTC day in
 * Upstash; once CHAT_DAILY_CAP is hit, callers stop calling the AI. When Upstash
 * is missing, slow (over the deadline) or failing, a per-instance counter with
 * the same cap takes over, so an outage is fast and spend stays capped.
 */
const TTL_SECONDS = 60 * 60 * 26; // ~26h, the key is dated so it only needs to outlive its day

let memory = { day: "", count: 0 };

/** Per-instance count for `day`, starting from 0 again when the UTC day changes. */
function countInMemory(day: string): number {
  if (memory.day !== day) memory = { day, count: 0 };
  memory.count += 1;
  return memory.count;
}

/** Spend one unit of today's budget. True while today's count is within the cap. */
export async function allowDailyUsage(): Promise<boolean> {
  const cap = getChatConfig().dailyCap;
  if (!Number.isFinite(cap) || cap <= 0) return true; // 0 means no cap

  const day = new Date().toISOString().slice(0, 10);
  const redis = getUpstash();
  if (!redis) {
    noteMemoryFallback("not configured");
  } else if (upstashUsable()) {
    try {
      const key = `@portfolio/chat:day:${day}`;
      const count = await withDeadline(
        (async () => {
          const n = await redis.incr(key);
          if (n === 1) await redis.expire(key, TTL_SECONDS);
          return n;
        })(),
      );
      return count <= cap;
    } catch (e) {
      markUpstashDown(e);
    }
  }
  return countInMemory(day) <= cap;
}
