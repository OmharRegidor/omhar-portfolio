import { getChatConfig } from "@/lib/ai/config";
import { iterateSSE } from "@/lib/ai/sse";
import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";

interface GeminiChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/**
 * Google Gemini (free tier) — fallback provider. Note: the free tier may use
 * submitted prompts to improve Google's models, so this sits BEHIND Groq and is
 * only reached on Groq failure. Disclose this in the UI.
 */
export const geminiProvider: ChatProvider = {
  id: "google",
  isConfigured() {
    return getChatConfig().googleApiKey.length > 0;
  },
  async *streamChat(opts: ChatStreamOptions) {
    const cfg = getChatConfig();
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${cfg.geminiModel}:streamGenerateContent?alt=sse`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": cfg.googleApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: opts.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxOutputTokens,
        },
      }),
      signal: opts.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`gemini: HTTP ${res.status}`);
    }

    for await (const payload of iterateSSE(res.body)) {
      if (payload === "[DONE]") return;
      let chunk: GeminiChunk;
      try {
        chunk = JSON.parse(payload) as GeminiChunk;
      } catch {
        continue;
      }
      const text = chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (text) yield text;
    }
  },
};
