import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

/**
 * Shared, bounded Upstash access for the per-IP rate limit (lib/rate-limit.ts)
 * and the daily usage cap (lib/chat/usage.ts).
 *
 * Why bounded: with the client defaults (5 retries with exponential backoff, and
 * @upstash/ratelimit's own 5 s "allow on timeout"), a database that stops
 * answering cost every chat request ~9 s and then let it through unlimited. Now
 * each check gets one attempt and a hard deadline, and on failure the callers
 * switch to their in-memory fallback instead of failing open.
 */

/** Hard ceiling on one Upstash check (all of its round trips included). */
export const UPSTASH_DEADLINE_MS = 1500;

/**
 * After a failure, skip Upstash for this long and go straight to the in-memory
 * fallback, so a dead database does not add the full deadline to every request.
 */
export const UPSTASH_COOLDOWN_MS = 30_000;

let client: Redis | null | undefined;
let downUntil = 0;
let fallbackLogged = false;

/** The Upstash client, or null when the Upstash env vars are missing or invalid. */
export function getUpstash(): Redis | null {
  if (client !== undefined) return client;
  try {
    const env = getEnv();
    client = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
      // One attempt only. Note `retry: false` still makes two attempts in
      // @upstash/redis 1.38, while `retries: 0` makes exactly one.
      retry: { retries: 0 },
      // A fresh per-request signal aborts the fetch itself at the deadline, so
      // a hung socket is released and not just ignored.
      signal: () => AbortSignal.timeout(UPSTASH_DEADLINE_MS),
    });
  } catch {
    client = null;
  }
  return client;
}

/** False while in the cooldown that follows a failed Upstash call. */
export function upstashUsable(): boolean {
  return Date.now() >= downUntil;
}

/** Race `work` against the deadline. Rejects if Upstash has not answered in time. */
export function withDeadline<T>(work: Promise<T>, ms = UPSTASH_DEADLINE_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`upstash: no answer within ${ms} ms`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Record a failed call: start the cooldown and note the fallback. */
export function markUpstashDown(reason: unknown): void {
  downUntil = Date.now() + UPSTASH_COOLDOWN_MS;
  noteMemoryFallback(reason instanceof Error ? reason.message : String(reason));
}

/**
 * Log, once per instance (not per request), that limits are running from
 * memory. These limits are per instance, so they are looser than the shared
 * Upstash ones, but they still cap spend while Upstash is away.
 */
export function noteMemoryFallback(reason: string): void {
  if (fallbackLogged) return;
  fallbackLogged = true;
  if (process.env.NODE_ENV !== "test") {
    console.warn(`[limits] Upstash unavailable (${reason}), using in-memory limits on this instance.`);
  }
}
