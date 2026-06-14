import { getChatConfig } from "@/lib/ai/config";
import { iterateSSE } from "@/lib/ai/sse";
import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/**
 * Groq (OpenAI-compatible) — primary provider. Fast, free, no training on data.
 * Throws before the first yield on auth/quota/network errors so the runner can
 * fall through to the next provider.
 */
export const groqProvider: ChatProvider = {
  id: "groq",
  isConfigured() {
    return getChatConfig().groqApiKey.length > 0;
  },
  async *streamChat(opts: ChatStreamOptions) {
    const cfg = getChatConfig();
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.groqApiKey}`,
      },
      body: JSON.stringify({
        model: cfg.groqModel,
        stream: true,
        temperature: opts.temperature,
        max_completion_tokens: opts.maxOutputTokens,
        messages: [
          { role: "system", content: opts.system },
          ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: opts.signal,
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new Error(`groq: HTTP ${res.status} ${body.slice(0, 300)}`.trim());
    }

    for await (const payload of iterateSSE(res.body)) {
      if (payload === "[DONE]") return;
      let chunk: GroqChunk;
      try {
        chunk = JSON.parse(payload) as GroqChunk;
      } catch {
        continue;
      }
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) yield delta;
    }
  },
};
