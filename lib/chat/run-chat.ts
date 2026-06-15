import type { ChatMessage } from "@/content/schemas";
import { boundMessages } from "@/lib/chat/history";
import { buildSystemPrompt, wrapUserMessage } from "@/lib/chat/system-prompt";
import { getProviderChain } from "@/lib/ai/registry";
import { getChatConfig } from "@/lib/ai/config";
import { STATIC_FALLBACK_REPLY } from "@/lib/ai/providers/static";
import type { ChatProvider, ProviderMessage } from "@/lib/ai/types";

const MAX_OUTPUT_TOKENS = 350;
const TEMPERATURE = 0.3;

export interface RunChatArgs {
  messages: ChatMessage[];
  signal?: AbortSignal;
  /** Injectable for tests; defaults to the env-driven provider chain. */
  providers?: ChatProvider[];
}

export function toProviderMessages(messages: ChatMessage[]): ProviderMessage[] {
  const mapped: ProviderMessage[] = messages.map((m) =>
    m.role === "user"
      ? { role: "user", content: wrapUserMessage(m.content) }
      : { role: "assistant", content: m.content },
  );
  // Providers like Gemini require the thread to BEGIN with a user turn — strip
  // any leading assistant turns unconditionally (a bounded window can start with
  // one). An all-assistant thread (only reachable via a crafted API call) reduces
  // to [] and degrades to the static reply, which is acceptable.
  while (mapped[0]?.role === "assistant") mapped.shift();
  return mapped;
}

/**
 * Build a per-attempt signal whose timeout bounds ONLY time-to-first-chunk. Call
 * `clear()` the moment the first chunk arrives so a slow-but-valid stream is not
 * truncated mid-response — after that the stream is bound only to the inbound
 * (client-disconnect) signal.
 */
function firstChunkDeadline(timeoutMs: number, inbound?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("first-chunk timeout", "TimeoutError")),
    timeoutMs,
  );
  const signal = inbound ? AbortSignal.any([inbound, controller.signal]) : controller.signal;
  return { signal, clear: () => clearTimeout(timer) };
}

function streamResponse(
  providerId: string,
  iterator: AsyncIterator<string>,
  firstValue: string,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(firstValue));
      try {
        while (true) {
          const { done, value } = await iterator.next();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(value));
        }
      } catch {
        // Mid-stream provider failure is rare on free tiers and can't be retried
        // cleanly (bytes already sent). End gracefully with what we have.
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-chat-provider": providerId,
    },
  });
}

/**
 * Run the chat through the provider fallback chain. The first provider to yield
 * a chunk wins; providers that fail before yielding are skipped. The static
 * provider terminates the chain, so this NEVER returns a 5xx to the visitor.
 */
export async function runChatWithFallback(args: RunChatArgs): Promise<Response> {
  const providers = args.providers ?? getProviderChain();
  const { timeoutMs } = getChatConfig();
  const base = {
    system: buildSystemPrompt(),
    messages: toProviderMessages(boundMessages(args.messages)),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: TEMPERATURE,
  };

  for (const provider of providers) {
    // The deadline bounds time-to-first-chunk only, so a provider that accepts
    // then stalls is skipped — but a slow, successful stream is not truncated.
    const deadline = firstChunkDeadline(timeoutMs, args.signal);
    const iterator = provider
      .streamChat({ ...base, signal: deadline.signal })
      [Symbol.asyncIterator]();
    try {
      const first = await iterator.next();
      deadline.clear(); // first chunk in — stop the deadline; stream is now client-bound
      if (first.done) continue; // provider produced nothing — try the next one
      return streamResponse(provider.id, iterator, first.value);
    } catch (e) {
      deadline.clear();
      // Surface WHY a provider was skipped (the error carries the upstream body)
      // so a misconfiguration is diagnosable instead of silently degrading.
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `[chat] provider "${provider.id}" failed before first chunk:`,
          e instanceof Error ? e.message : e,
        );
      }
      continue; // provider failed before first chunk — try the next one
    }
  }

  // Defensive: static should always succeed, but guarantee no 5xx regardless.
  return new Response(STATIC_FALLBACK_REPLY, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-chat-provider": "static",
    },
  });
}
