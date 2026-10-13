import type { ChatProvider, ChatStreamOptions } from "@/lib/ai/types";

/**
 * Build a per-attempt signal whose timeout bounds ONLY time-to-first-chunk. Call
 * `clear()` the moment the first chunk arrives so a slow-but-valid stream is not
 * truncated mid-response. After that the stream is bound only to the inbound
 * (client-disconnect) signal.
 */
export function firstChunkDeadline(timeoutMs: number, inbound?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("first-chunk timeout", "TimeoutError")),
    timeoutMs,
  );
  const signal = inbound ? AbortSignal.any([inbound, controller.signal]) : controller.signal;
  return { signal, clear: () => clearTimeout(timer) };
}

export interface CompleteArgs {
  providers: ChatProvider[];
  request: Omit<ChatStreamOptions, "signal">;
  /** Time-to-first-chunk budget per provider (CHAT_PROVIDER_TIMEOUT_MS). */
  timeoutMs: number;
  signal?: AbortSignal;
  /** Log prefix for skipped providers, e.g. "[demo/inbox]". */
  label: string;
}

/**
 * Non-streaming sibling of runChatWithFallback: collect one provider's whole
 * stream into a string. Providers are tried in order. A provider that fails,
 * stalls past the first-chunk deadline, throws mid-stream or returns only
 * whitespace is skipped (nothing has been sent to the client yet, so retrying
 * on the next one is clean). Returns null when every provider fails.
 */
export async function completeWithFallback(
  args: CompleteArgs,
): Promise<{ text: string; providerId: string } | null> {
  for (const provider of args.providers) {
    if (args.signal?.aborted) return null; // client is gone, stop spending
    const deadline = firstChunkDeadline(args.timeoutMs, args.signal);
    try {
      let text = "";
      for await (const chunk of provider.streamChat({ ...args.request, signal: deadline.signal })) {
        deadline.clear(); // first chunk in, the rest is bound to the client only
        text += chunk;
      }
      deadline.clear();
      if (text.trim().length > 0) return { text, providerId: provider.id };
    } catch (e) {
      deadline.clear();
      if (process.env.NODE_ENV !== "test") {
        console.error(
          `${args.label} provider "${provider.id}" failed:`,
          e instanceof Error ? e.message : e,
        );
      }
    }
  }
  return null;
}
