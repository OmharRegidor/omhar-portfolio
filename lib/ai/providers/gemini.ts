import { getChatConfig } from "@/lib/ai/config";
import { iterateSSE } from "@/lib/ai/sse";
import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";

interface GeminiChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/**
 * Google Gemini (free tier), second in the default chain. The free tier costs
 * nothing while the Google project has no billing account linked, and a spent
 * quota returns 429, which falls through to the next provider. It may use
 * prompts to improve Google's models, so the chat panel tells visitors not to
 * share private details and the inbox demo asks for made-up emails.
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
          // gemini-2.5-flash enables "dynamic thinking" by default, and thinking
          // tokens count against maxOutputTokens — with a small budget the model
          // can spend it all reasoning and return EMPTY text. Disable it for this
          // fast, grounded Q&A use case so the budget is spent on the answer.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: opts.signal,
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new Error(`gemini: HTTP ${res.status} ${body.slice(0, 300)}`.trim());
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
