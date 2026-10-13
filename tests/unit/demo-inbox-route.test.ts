import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type { ChatProvider } from "@/lib/ai/types";

const DRAFT = "Hi Maria,\n\nYour order [order number] is on its way.\n\nThe team";

/** Answers triage (small token budget) and draft from fixed text. */
function provider(id: string, triage: string, draft = DRAFT): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat(opts) {
      yield opts.maxOutputTokens <= 60 ? triage : draft;
    },
  };
}

function failing(id: string): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat(): AsyncGenerator<string> {
      throw new Error(`${id} is down`);
    },
  };
}

function mockLimit(success = true) {
  const limit = vi.fn().mockResolvedValue({ success, limit: 10, remaining: success ? 9 : 0, reset: 0 });
  vi.doMock("@/lib/rate-limit", () => ({ getRateLimit: () => ({ limit }) }));
  return limit;
}

function mockUsage(allowed = true) {
  const allowDailyUsage = vi.fn().mockResolvedValue(allowed);
  vi.doMock("@/lib/chat/usage", () => ({ allowDailyUsage }));
  return allowDailyUsage;
}

function mockProviders(providers: ChatProvider[]) {
  vi.doMock("@/lib/ai/registry", () => ({ getLiveProviderChain: () => providers }));
}

/** The usual happy-path wiring; override any piece per test. */
function setup(opts: { providers?: ChatProvider[]; limited?: boolean; allowed?: boolean } = {}) {
  const limit = mockLimit(!opts.limited);
  const usage = mockUsage(opts.allowed ?? true);
  mockProviders(opts.providers ?? [provider("anthropic", "REPLY\nThe customer is asking about an order.")]);
  return { limit, usage };
}

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/rate-limit");
  vi.doUnmock("@/lib/chat/usage");
  vi.doUnmock("@/lib/ai/registry");
  delete process.env.CHAT_ENABLED;
});

afterEach(() => {
  delete process.env.CHAT_ENABLED;
});

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/demo/inbox", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9, 10.0.0.1", ...headers },
  });
}

const valid = { email: "Hi, where is my order? Maria" };

async function post(body: unknown, headers?: Record<string, string>) {
  const { POST } = await import("@/app/api/demo/inbox/route");
  return POST(req(body, headers));
}

describe("POST /api/demo/inbox", () => {
  it("REPLY: 200 with the triage, a draft and the provider, never cached", async () => {
    setup();
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      needsReply: true,
      reason: "The customer is asking about an order.",
      draft: DRAFT,
      provider: "anthropic",
    });
  });

  it("SKIP: 200 with draft null", async () => {
    setup({ providers: [provider("groq", "SKIP\nA sales offer, not a customer question.")] });
    const res = await post({ email: "Grow your store 10x with our SEO package!" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      needsReply: false,
      reason: "A sales offer, not a customer question.",
      draft: null,
      provider: "groq",
    });
  });

  it("unparseable triage: 200 treated as needing a reply", async () => {
    setup({ providers: [provider("anthropic", "I am not sure what to do here")] });
    const body = await (await post(valid)).json();
    expect(body).toMatchObject({
      needsReply: true,
      reason: "Could not decide, so it is treated as needing a reply.",
      draft: DRAFT,
    });
  });

  it("falls through to the next provider when the first fails", async () => {
    setup({ providers: [failing("anthropic"), provider("groq", "REPLY\nA question.")] });
    expect((await (await post(valid)).json()).provider).toBe("groq");
  });

  it("503 DEMO_OFFLINE when no live provider is configured, without spending a daily unit", async () => {
    const { usage } = setup({ providers: [] });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).error.code).toBe("DEMO_OFFLINE");
    expect(usage).not.toHaveBeenCalled();
  });

  it("503 DEMO_OFFLINE when every provider fails", async () => {
    setup({ providers: [failing("anthropic"), failing("groq")] });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("DEMO_OFFLINE");
  });

  it("503 DEMO_OFFLINE when the daily cap is used up", async () => {
    setup({ allowed: false });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("DEMO_OFFLINE");
  });

  it("503 DEMO_OFFLINE when CHAT_ENABLED=0", async () => {
    process.env.CHAT_ENABLED = "0";
    setup();
    expect((await post(valid)).status).toBe(503);
  });

  it("spends exactly one daily unit per request (two AI steps, one unit)", async () => {
    const { usage } = setup();
    await post(valid);
    expect(usage).toHaveBeenCalledTimes(1);
  });

  it("429 with Retry-After when the per-IP limit is hit, keyed on the first forwarded IP", async () => {
    const { limit, usage } = setup({ limited: true });
    const res = await post(valid);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(limit).toHaveBeenCalledWith("9.9.9.9");
    expect(usage).not.toHaveBeenCalled();
  });

  describe("bad input is 400", () => {
    const cases: Array<[string, unknown]> = [
      ["invalid JSON", "{not-json"],
      ["empty object", {}],
      ["email not a string", { email: 42 }],
      ["whitespace-only email", { email: "   \n  " }],
      ["email over 1500 chars", { email: "a".repeat(1501) }],
      ["extra fields (strict)", { email: "hi", evil: "x" }],
    ];
    for (const [name, body] of cases) {
      it(name, async () => {
        setup();
        const res = await post(body);
        expect(res.status).toBe(400);
        expect(res.headers.get("cache-control")).toBe("no-store");
      });
    }

    it("accepts exactly 1500 chars after trimming", async () => {
      setup();
      expect((await post({ email: `  ${"a".repeat(1500)}  ` })).status).toBe(200);
    });

    it("rejects a body over 4 KB by its real byte length, even if content-length under-reports it", async () => {
      setup();
      // 1400 chars but 4200 bytes in UTF-8: passes the char limit, fails the byte cap.
      const res = await post({ email: "€".repeat(1400) }, { "content-length": "10" });
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("rejects early on a large content-length header", async () => {
      setup();
      expect((await post(valid, { "content-length": "99999" })).status).toBe(400);
    });
  });

  it("405 on GET", async () => {
    const { GET } = await import("@/app/api/demo/inbox/route");
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });
});
