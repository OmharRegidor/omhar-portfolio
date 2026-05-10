import { describe, it, expect } from "vitest";
import { EnvSchema } from "@/lib/env";

describe("EnvSchema", () => {
  it("rejects empty env (missing required keys)", () => {
    const r = EnvSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects non-URL UPSTASH_REDIS_REST_URL", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "not-a-url",
      UPSTASH_REDIS_REST_TOKEN: "x",
    });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid env", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "x",
    });
    expect(r.success).toBe(true);
  });

  it("rejects RATE_LIMIT_BYPASS values other than 0/1", () => {
    const r = EnvSchema.safeParse({
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "x",
      RATE_LIMIT_BYPASS: "true",
    });
    expect(r.success).toBe(false);
  });
});
