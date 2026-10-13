import { getChatConfig } from "@/lib/ai/config";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import { groqProvider } from "@/lib/ai/providers/groq";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { staticProvider } from "@/lib/ai/providers/static";
import type { ChatProvider } from "@/lib/ai/types";

const REGISTRY: Record<string, ChatProvider> = {
  anthropic: anthropicProvider,
  groq: groqProvider,
  google: geminiProvider,
};

/**
 * The live (AI) providers from AI_PROVIDERS, in order, keeping only those whose
 * API key is configured. No static fallback: callers that must always answer
 * use getProviderChain(); the inbox demo uses this and reports "offline".
 */
export function getLiveProviderChain(): ChatProvider[] {
  const cfg = getChatConfig();
  return cfg.providers
    .map((id) => REGISTRY[id])
    .filter((p): p is ChatProvider => p !== undefined && p.isConfigured());
}

/**
 * Build the ordered provider chain from AI_PROVIDERS, keeping only providers
 * whose API key is configured, and ALWAYS appending the static fallback last so
 * the chain is guaranteed to resolve.
 */
export function getProviderChain(): ChatProvider[] {
  return [...getLiveProviderChain(), staticProvider];
}
