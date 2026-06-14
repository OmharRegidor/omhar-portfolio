import { describe, it, expect, afterEach } from "vitest";
import { runChatWithFallback, toProviderMessages } from "@/lib/chat/run-chat";
import { staticProvider, STATIC_FALLBACK_REPLY } from "@/lib/ai/providers/static";
import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";
import type { ChatMessage } from "@/content/schemas";

const ask: ChatMessage[] = [{ role: "user", content: "who is Omhar?" }];

function yielding(id: string, parts: string[]): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat() {
      for (const p of parts) yield p;
    },
  };
}

/** Accepts the request but never produces a chunk until aborted. */
function stalling(id: string): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat(opts: ChatStreamOptions) {
      await new Promise<void>((_, reject) => {
        opts.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
      yield "unreachable";
    },
  };
}

/** Yields the first chunk immediately, then delays the second (honoring abort). */
function slowSecondChunk(id: string): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat(opts: ChatStreamOptions) {
      yield "first ";
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, 120);
        opts.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("aborted", "AbortError"));
        });
      });
      yield "second";
    },
  };
}

function throwingOnFirstChunk(id: string): ChatProvider {
  return {
    id,
    isConfigured: () => true,
    async *streamChat(): AsyncGenerator<string> {
      throw new Error(`${id} is down`);
    },
  };
}

describe("runChatWithFallback", () => {
  it("streams the first working provider's output with its id in the header", async () => {
    const res = await runChatWithFallback({
      messages: ask,
      providers: [yielding("groq", ["Hello", " world"]), staticProvider],
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Chat-Provider")).toBe("groq");
    expect(await res.text()).toBe("Hello world");
  });

  it("falls through to the next provider when the first fails before any output", async () => {
    const res = await runChatWithFallback({
      messages: ask,
      providers: [throwingOnFirstChunk("groq"), yielding("google", ["from gemini"]), staticProvider],
    });
    expect(res.headers.get("X-Chat-Provider")).toBe("google");
    expect(await res.text()).toBe("from gemini");
  });

  it("degrades to the static Calendly reply when every live provider fails (never 5xx)", async () => {
    const res = await runChatWithFallback({
      messages: ask,
      providers: [throwingOnFirstChunk("groq"), throwingOnFirstChunk("google"), staticProvider],
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Chat-Provider")).toBe("static");
    expect(await res.text()).toBe(STATIC_FALLBACK_REPLY);
  });

  it("falls through when a provider succeeds but yields nothing", async () => {
    const res = await runChatWithFallback({
      messages: ask,
      providers: [yielding("groq", []), yielding("google", ["ok"]), staticProvider],
    });
    expect(res.headers.get("X-Chat-Provider")).toBe("google");
    expect(await res.text()).toBe("ok");
  });

  it("times out a stalled provider and advances to the next one", async () => {
    process.env.CHAT_PROVIDER_TIMEOUT_MS = "50";
    try {
      const res = await runChatWithFallback({
        messages: ask,
        providers: [stalling("groq"), yielding("google", ["recovered"]), staticProvider],
      });
      expect(res.headers.get("X-Chat-Provider")).toBe("google");
      expect(await res.text()).toBe("recovered");
    } finally {
      delete process.env.CHAT_PROVIDER_TIMEOUT_MS;
    }
  });

  it("does NOT truncate a slow stream once the first chunk has arrived (timeout = time-to-first-chunk only)", async () => {
    process.env.CHAT_PROVIDER_TIMEOUT_MS = "50";
    try {
      const res = await runChatWithFallback({
        messages: ask,
        providers: [slowSecondChunk("groq"), staticProvider],
      });
      expect(res.headers.get("X-Chat-Provider")).toBe("groq");
      expect(await res.text()).toBe("first second");
    } finally {
      delete process.env.CHAT_PROVIDER_TIMEOUT_MS;
    }
  });
});

describe("toProviderMessages", () => {
  afterEach(() => undefined);

  it("strips leading assistant turns so the thread begins with a user turn", () => {
    const out = toProviderMessages([
      { role: "assistant", content: "earlier reply" },
      { role: "user", content: "now" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user"]);
    expect(out[0]!.content).toContain("now");
  });

  it("wraps user content as untrusted data but passes assistant turns through", () => {
    const out = toProviderMessages([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi there" },
      { role: "user", content: "more" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(out[0]!.content).not.toBe("hello"); // wrapped
    expect(out[0]!.content).toContain("hello");
    expect(out[1]!.content).toBe("hi there"); // passed through
  });
});
