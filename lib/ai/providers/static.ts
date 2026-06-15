import { profile } from "@/content/profile";
import type { ChatProvider } from "@/lib/ai/types";

/** Terminal fallback message — shown only if every live provider fails. */
export const STATIC_FALLBACK_REPLY =
  `Thanks for reaching out! I can't answer that right now, but the quickest way to reach Omhar is to book a 30-min call: ${profile.calendlyUrl}`;

/**
 * Always-available terminal provider. It never throws, so the fallback chain is
 * guaranteed to resolve and the visitor always gets a useful reply (the worst
 * case is simply today's known-good "book a call" behavior).
 */
export const staticProvider: ChatProvider = {
  id: "static",
  isConfigured: () => true,
  async *streamChat() {
    yield STATIC_FALLBACK_REPLY;
  },
};
