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

/** Combine the inbound request signal with a per-attempt timeout. */
function attemptSignal(timeoutMs: number, inbound?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return inbound ? AbortSignal.any([inbound, timeout]) : timeout;
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
    // A fresh timeout per attempt so a provider that accepts then stalls before
    // the first chunk is aborted and the chain advances (instead of hanging).
    const opts = { ...base, signal: attemptSignal(timeoutMs, args.signal) };
    const iterator = provider.streamChat(opts)[Symbol.asyncIterator]();
    try {
      const first = await iterator.next();
      if (first.done) continue; // provider produced nothing — try the next one
      return streamResponse(provider.id, iterator, first.value);
    } catch {
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
