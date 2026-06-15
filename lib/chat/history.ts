import type { ChatMessage } from "@/content/schemas";

/**
 * Bound a conversation to a soft character budget, keeping the most recent
 * messages. Walks from the newest backward and stops before adding a message
 * that would push the total over `maxChars` — but always keeps at least the
 * final message so the model has something to respond to.
 *
 * This is a cheap, provider-agnostic guard (≈4 chars/token) that sits on top of
 * the Zod turn cap and the raw body-size cap. It keeps the prompt + history + KB
 * comfortably inside the smallest free-tier context window even under adversarial
 * input.
 */
export function boundMessages(messages: ChatMessage[], maxChars = 6000): ChatMessage[] {
  if (messages.length === 0) return messages;

  const kept: ChatMessage[] = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    const len = m.content.length;
    if (kept.length > 0 && used + len > maxChars) break;
    kept.push(m);
    used += len;
  }
  return kept.reverse();
}
