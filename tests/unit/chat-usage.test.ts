import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@upstash/redis");
  vi.doUnmock("@/lib/env");
  delete process.env.CHAT_DAILY_CAP;
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

  it("FAILS OPEN (returns true) when Redis throws — an outage must not disable chat", async () => {
    process.env.CHAT_DAILY_CAP = "1";
    mockRedis(
      vi.fn(async () => {
        throw new Error("redis down");
      }),
    );
    const { allowDailyUsage } = await import("@/lib/chat/usage");
    expect(await allowDailyUsage()).toBe(true);
  });
});
