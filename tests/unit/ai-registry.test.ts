import { describe, it, expect, afterEach } from "vitest";
import { getLiveProviderChain, getProviderChain } from "@/lib/ai/registry";

const ENV_KEYS = ["ANTHROPIC_API_KEY", "GROQ_API_KEY", "GOOGLE_AI_API_KEY", "AI_PROVIDERS"];
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
    setEnv({});
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["static"]);
  });

  it("includes a configured provider ahead of the static fallback", () => {
    setEnv({ GROQ_API_KEY: "gsk_test_key" });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["groq", "static"]);
  });

  it("uses only the free providers by default, so a stray Claude key never costs money", () => {
    setEnv({
      ANTHROPIC_API_KEY: "sk-ant-test",
      GROQ_API_KEY: "gsk_test_key",
      GOOGLE_AI_API_KEY: "goog_test_key",
    });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["groq", "google", "static"]);
  });

  it("honors AI_PROVIDERS ordering and always ends with static", () => {
    setEnv({
      ANTHROPIC_API_KEY: "sk-ant-test",
      GROQ_API_KEY: "gsk_test_key",
      GOOGLE_AI_API_KEY: "goog_test_key",
      AI_PROVIDERS: "google,groq,anthropic",
    });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["google", "groq", "anthropic", "static"]);
  });

  it("skips providers whose key is missing even if named in AI_PROVIDERS", () => {
    setEnv({ GOOGLE_AI_API_KEY: "goog_test_key", AI_PROVIDERS: "anthropic,groq,google" });
    const chain = getProviderChain();
    expect(chain.map((p) => p.id)).toEqual(["google", "static"]);
  });
});

describe("getLiveProviderChain", () => {
  it("never includes the static fallback", () => {
    setEnv({ GOOGLE_AI_API_KEY: "goog_test_key" });
    expect(getLiveProviderChain().map((p) => p.id)).toEqual(["google"]);
  });

  it("leaves Claude out by default, even with its key set", () => {
    setEnv({ ANTHROPIC_API_KEY: "sk-ant-test" });
    expect(getLiveProviderChain()).toEqual([]);
  });

  it("runs Claude when AI_PROVIDERS opts in", () => {
    setEnv({ ANTHROPIC_API_KEY: "sk-ant-test", AI_PROVIDERS: "anthropic" });
    expect(getLiveProviderChain().map((p) => p.id)).toEqual(["anthropic"]);
  });

  it("is empty when no live provider is configured", () => {
    setEnv({});
    expect(getLiveProviderChain()).toEqual([]);
  });
});
