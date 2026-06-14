import { describe, it, expect, afterEach } from "vitest";
import { getProviderChain } from "@/lib/ai/registry";

const ENV_KEYS = ["GROQ_API_KEY", "GOOGLE_AI_API_KEY", "AI_PROVIDERS"];
const saved: Record<string, string | undefined> = {};

function setEnv(env: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
}

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("getProviderChain", () => {
  it("returns only the static fallback when no API keys are configured", () => {
    setEnv({ GROQ_API_KEY: undefined, GOOGLE_AI_API_KEY: undefined, AI_PROVIDERS: undefined });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["static"]);
  });

  it("includes a configured provider ahead of the static fallback", () => {
    setEnv({ GROQ_API_KEY: "gsk_test_key", GOOGLE_AI_API_KEY: undefined, AI_PROVIDERS: undefined });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["groq", "static"]);
  });

  it("honors AI_PROVIDERS ordering and always ends with static", () => {
    setEnv({ GROQ_API_KEY: "gsk_test_key", GOOGLE_AI_API_KEY: "goog_test_key", AI_PROVIDERS: "google,groq" });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["google", "groq", "static"]);
  });

  it("skips providers whose key is missing even if named in AI_PROVIDERS", () => {
    setEnv({ GROQ_API_KEY: undefined, GOOGLE_AI_API_KEY: "goog_test_key", AI_PROVIDERS: "groq,google" });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["google", "static"]);
  });
});
