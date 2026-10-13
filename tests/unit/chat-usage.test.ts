import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@upstash/redis");
  vi.doUnmock("@/lib/env");
  delete process.env.CHAT_DAILY_CAP;
});

afterEach(() => {
  vi.useRealTimers();
});

type IncrFn = () => Promise<number>;

function mockRedis(incr: IncrFn, expire = vi.fn()) {
  vi.doMock("@/lib/env", () => ({
    getEnv: () => ({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" }),
  }));
  vi.doMock("@upstash/redis", () => ({
    Redis: class {
      incr = incr;
      expire = expire;
    },
  }));
  return { expire };
}

/** Upstash env vars missing: getEnv() throws, as in lib/env.ts. */
function mockNoUpstash() {
  vi.doMock("@/lib/env", () => ({
    getEnv: () => {
      throw new Error("Invalid environment");
    },
  }));
}

async function allowN(allow: () => Promise<boolean>, n: number): Promise<boolean[]> {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push(await allow());
  return out;
}

describe("allowDailyUsage", () => {
  it("short-circuits to allowed when the cap is 0, without touching Redis", async () => {
    process.env.CHAT_DAILY_CAP = "0";
    const incr = vi.fn();
    mockRedis(incr as unknown as IncrFn);
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowDailyUsage()).toBe(true);
    expect(incr).not.toHaveBeenCalled();
  });

  it("allows while under the cap and blocks once it is exceeded", async () => {
    process.env.CHAT_DAILY_CAP = "2";
    let n = 0;
    mockRedis(vi.fn(async () => ++n));
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowDailyUsage()).toBe(true); // count 1
    expect(await allowDailyUsage()).toBe(true); // count 2
    expect(await allowDailyUsage()).toBe(false); // count 3 > 2
  });

  it("sets a TTL on the first hit of the day", async () => {
    process.env.CHAT_DAILY_CAP = "100";
    let n = 0;
    const { expire } = mockRedis(vi.fn(async () => ++n));
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    await allowDailyUsage();
    expect(expire).toHaveBeenCalledTimes(1);
  });

  it("falls back to the in-memory counter when Redis throws, and still enforces the cap", async () => {
    process.env.CHAT_DAILY_CAP = "2";
    const incr = vi.fn(async () => {
      throw new Error("redis down");
    });
    mockRedis(incr);
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowN(allowDailyUsage, 3)).toEqual([true, true, false]);
    expect(incr).toHaveBeenCalledTimes(1); // later calls skip Redis during the cooldown
  });

  it("uses the in-memory counter when Upstash is not configured", async () => {
    process.env.CHAT_DAILY_CAP = "1";
    mockNoUpstash();
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowN(allowDailyUsage, 2)).toEqual([true, false]);
  });

  it("CHAT_DAILY_CAP=0 still means no cap on the in-memory counter", async () => {
    process.env.CHAT_DAILY_CAP = "0";
    mockNoUpstash();
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect((await allowN(allowDailyUsage, 50)).every(Boolean)).toBe(true);
  });

  it("gives up on a hung Redis call at the 1500 ms deadline and counts in memory", async () => {
    vi.useFakeTimers();
    process.env.CHAT_DAILY_CAP = "1";
    mockRedis(vi.fn(() => new Promise<number>(() => {})));
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    let settled = false;
    const pending = allowDailyUsage().then((ok) => {
      settled = true;
      return ok;
    });
    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBe(true); // memory count 1 of 1
    expect(await allowDailyUsage()).toBe(false); // memory count 2 > 1
  });

  it("starts the in-memory count again when the UTC day rolls over", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T23:59:00Z"));
    process.env.CHAT_DAILY_CAP = "2";
    mockNoUpstash();
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowN(allowDailyUsage, 3)).toEqual([true, true, false]);
    vi.setSystemTime(new Date("2026-10-14T00:00:01Z"));
    expect(await allowN(allowDailyUsage, 3)).toEqual([true, true, false]);
  });
});
