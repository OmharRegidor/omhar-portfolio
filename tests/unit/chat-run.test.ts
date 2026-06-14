import { describe, it, expect } from "vitest";
import { runChatWithFallback } from "@/lib/chat/run-chat";
import { staticProvider, STATIC_FALLBACK_REPLY } from "@/lib/ai/providers/static";
import type { ChatProvider } from "@/lib/ai/types";
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
});
