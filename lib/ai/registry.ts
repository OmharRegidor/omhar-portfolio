import { getChatConfig } from "@/lib/ai/config";
import { groqProvider } from "@/lib/ai/providers/groq";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { staticProvider } from "@/lib/ai/providers/static";
import type { ChatProvider } from "@/lib/ai/types";

const REGISTRY: Record<string, ChatProvider> = {
  groq: groqProvider,
  google: geminiProvider,
};

/**
 * Build the ordered provider chain from AI_PROVIDERS, keeping only providers
 * whose API key is configured, and ALWAYS appending the static fallback last so
 * the chain is guaranteed to resolve.
 */
export function getProviderChain(): ChatProvider[] {
  const cfg = getChatConfig();
  const chain = cfg.providers
    .map((id) => REGISTRY[id])
    .filter((p): p is ChatProvider => p !== undefined && p.isConfigured());
  return [...chain, staticProvider];
}
