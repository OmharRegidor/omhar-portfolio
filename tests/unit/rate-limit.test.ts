import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const OK = { success: true, limit: 10, remaining: 9, reset: 123 };

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@upstash/ratelimit");
  vi.doUnmock("@upstash/redis");
  vi.doUnmock("@/lib/env");
  delete process.env.RATE_LIMIT_BYPASS;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete process.env.RATE_LIMIT_BYPASS;
});

/** Upstash configured, with `limit` standing in for Ratelimit#limit. */
function mockUpstash(limit: (id: string) => Promise<unknown>) {
  const redisConfigs: Array<Record<string, unknown>> = [];
  const ratelimitConfigs: Array<Record<string, unknown>> = [];
  const limitFn = vi.fn(limit);
  vi.doMock("@/lib/env", () => ({
    getEnv: () => ({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" }),
  }));
  vi.doMock("@upstash/redis", () => ({
    Redis: class {
      constructor(cfg: Record<string, unknown>) {
        redisConfigs.push(cfg);
      }
    },
  }));
  vi.doMock("@upstash/ratelimit", () => ({
    Ratelimit: class {
      static slidingWindow = () => "sliding-window";
      limit = limitFn;
      constructor(cfg: Record<string, unknown>) {
        ratelimitConfigs.push(cfg);
      }
    },
  }));
  return { limitFn, redisConfigs, ratelimitConfigs };
}

/** Upstash env vars missing: getEnv() throws, as in lib/env.ts. */
function mockNoUpstash() {
  const getEnv = vi.fn(() => {
    throw new Error("Invalid environment");
  });
  vi.doMock("@/lib/env", () => ({ getEnv }));
  return { getEnv };
}

const down = () => Promise.reject(new Error("upstash down"));
const never = () => new Promise<never>(() => {});

async function hit(limiter: { limit(id: string): Promise<{ success: boolean }> }, id: string, n: number) {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push((await limiter.limit(id)).success);
  return out;
}

describe("getRateLimit with Upstash", () => {
  it("returns Upstash's answer when it responds", async () => {
    const { limitFn } = mockUpstash(async () => OK);
    const { getRateLimit } = await import("@/lib/rate-limit");
    expect(await getRateLimit().limit("1.2.3.4")).toEqual(OK);
    expect(limitFn).toHaveBeenCalledWith("1.2.3.4");
  });

  it("makes one attempt per call with a deadline signal, and turns off the library's fail-open timeout", async () => {
    const { redisConfigs, ratelimitConfigs } = mockUpstash(async () => OK);
    const { getRateLimit } = await import("@/lib/rate-limit");
    await getRateLimit().limit("ip");
    expect(redisConfigs[0]!.retry).toEqual({ retries: 0 });
    expect(typeof redisConfigs[0]!.signal).toBe("function");
    expect(ratelimitConfigs[0]!.timeout).toBe(0);
  });

  it("falls back to the in-memory window when Upstash fails: 10 per minute, then blocked", async () => {
    mockUpstash(down);
    const { getRateLimit } = await import("@/lib/rate-limit");
    const results = await hit(getRateLimit(), "1.2.3.4", 11);
    expect(results.slice(0, 10).every(Boolean)).toBe(true);
    expect(results[10]).toBe(false);
  });

  it("gives up on a hung Upstash call at the 1500 ms deadline and answers from memory", async () => {
    vi.useFakeTimers();
    const { limitFn } = mockUpstash(never);
    const { getRateLimit } = await import("@/lib/rate-limit");
    let settled = false;
    const pending = getRateLimit()
      .limit("ip")
      .then((r) => {
        settled = true;
        return r;
      });
    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).success).toBe(true);
    expect(limitFn).toHaveBeenCalledTimes(1);
  });

  it("skips Upstash during the 30 s cooldown after a failure, then tries it again", async () => {
    vi.useFakeTimers();
    const { limitFn } = mockUpstash(down);
    const { getRateLimit } = await import("@/lib/rate-limit");
    await getRateLimit().limit("ip");
    await getRateLimit().limit("ip");
    expect(limitFn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    await getRateLimit().limit("ip");
    expect(limitFn).toHaveBeenCalledTimes(2);
  });

  it("logs the fallback once per instance, not once per request", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockUpstash(down);
    const { getRateLimit } = await import("@/lib/rate-limit");
    await getRateLimit().limit("ip");
    vi.advanceTimersByTime(30_000); // past the cooldown, so Upstash fails a second time
    await getRateLimit().limit("ip");
    await getRateLimit().limit("ip");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/in-memory limits/);
  });
});

describe("getRateLimit without Upstash", () => {
  it("uses the in-memory window when Upstash is not configured (no longer fully open)", async () => {
    mockNoUpstash();
    const { getRateLimit } = await import("@/lib/rate-limit");
    const results = await hit(getRateLimit(), "ip", 11);
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(results[10]).toBe(false);
  });

  it("RATE_LIMIT_BYPASS=1 always allows and never touches Upstash", async () => {
    process.env.RATE_LIMIT_BYPASS = "1";
    const { getEnv } = mockNoUpstash();
    const { getRateLimit } = await import("@/lib/rate-limit");
    const results = await hit(getRateLimit(), "ip", 20);
    expect(results.every(Boolean)).toBe(true);
    expect(getEnv).not.toHaveBeenCalled();
  });

  it("refuses to load with the bypass on a live Vercel production deploy", async () => {
    process.env.RATE_LIMIT_BYPASS = "1";
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    await expect(import("@/lib/rate-limit")).rejects.toThrow(/forbidden on the live deployment/);
  });
});

describe("createMemoryLimiter", () => {
  it("frees a slot exactly when the oldest request is a minute old (sliding window)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T10:00:00Z"));
    mockNoUpstash();
    const { createMemoryLimiter } = await import("@/lib/rate-limit");
    const limiter = createMemoryLimiter();
    await hit(limiter, "ip", 10);
    expect((await limiter.limit("ip")).success).toBe(false);
    vi.advanceTimersByTime(59_999);
    expect((await limiter.limit("ip")).success).toBe(false);
    vi.advanceTimersByTime(1);
    expect((await limiter.limit("ip")).success).toBe(true);
  });

  it("counts each identifier on its own and reports remaining and reset", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T10:00:00Z"));
    mockNoUpstash();
    const { createMemoryLimiter } = await import("@/lib/rate-limit");
    const limiter = createMemoryLimiter(2, 60_000);
    await hit(limiter, "a", 2);
    expect((await limiter.limit("a")).success).toBe(false);
    const b = await limiter.limit("b");
    expect(b).toEqual({
      success: true,
      limit: 2,
      remaining: 1,
      reset: new Date("2026-10-13T10:01:00Z").getTime(),
    });
  });
});
