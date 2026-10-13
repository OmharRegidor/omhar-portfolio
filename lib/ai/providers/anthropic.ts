import { getChatConfig } from "@/lib/ai/config";
import { iterateSSE } from "@/lib/ai/sse";
import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicEvent {
  type?: string;
  delta?: { type?: string; text?: string };
  error?: { type?: string; message?: string };
}

/**
 * Model-specific request fields. Two things matter for the Haiku default:
 *
 * - Sampling: current Claude models (Haiku 5.5 included) reject any non-default
 *   `temperature` with a 400, so it is never sent. opts.temperature still drives
 *   Groq and Gemini; Claude is steered by the prompt alone.
 * - Thinking: Haiku 5.5 thinks by default and thinking tokens count against
 *   max_tokens, so a small budget (the inbox triage uses ~60) can be spent before
 *   any text. Turning it off keeps the budget for the answer and the first chunk
 *   fast. Only Haiku is switched off: some larger models reject "disabled".
 */
function modelFields(model: string): Record<string, unknown> {
  return model.startsWith("claude-haiku") ? { thinking: { type: "disabled" } } : {};
}

/**
 * Anthropic Claude, first in the chain when ANTHROPIC_API_KEY is set. Plain
 * fetch against the Messages API (no SDK), streamed as SSE. Throws before the
 * first yield on auth/quota/network errors so the runner can fall through to
 * the next provider.
 */
export const anthropicProvider: ChatProvider = {
  id: "anthropic",
  isConfigured() {
    return getChatConfig().anthropicApiKey.length > 0;
  },
  async *streamChat(opts: ChatStreamOptions) {
    const cfg = getChatConfig();
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.anthropicApiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: cfg.anthropicModel,
        max_tokens: opts.maxOutputTokens,
        stream: true,
        ...modelFields(cfg.anthropicModel),
        // The system prompt is identical on every request, so it is marked for
        // prompt caching (cheaper and faster on repeats). Prompts below the
        // model's minimum cacheable size are simply not cached, no error.
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        messages: opts.messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
      signal: opts.signal,
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new Error(`anthropic: HTTP ${res.status} ${body.slice(0, 300)}`.trim());
    }

    for await (const payload of iterateSSE(res.body)) {
      let event: AnthropicEvent;
      try {
        event = JSON.parse(payload) as AnthropicEvent;
      } catch {
        continue;
      }
      if (event.type === "content_block_delta") {
        const text = event.delta?.type === "text_delta" ? event.delta.text : undefined;
        if (typeof text === "string" && text.length > 0) yield text;
      } else if (event.type === "error") {
        // e.g. overloaded_error sent inside a 200 stream.
        const detail = `${event.error?.type ?? "error"} ${event.error?.message ?? ""}`.trim();
        throw new Error(`anthropic: ${detail}`);
      } else if (event.type === "message_stop") {
        return;
      }
    }
  },
};
