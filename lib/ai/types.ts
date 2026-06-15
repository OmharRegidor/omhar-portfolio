export type ChatRole = "system" | "user" | "assistant";

export interface ProviderMessage {
  role: ChatRole;
  content: string;
}

export interface ChatStreamOptions {
  /** Fully-assembled system prompt (server-only). */
  system: string;
  /** Bounded user/assistant turns, with user content already wrapped as untrusted data. */
  messages: ProviderMessage[];
  maxOutputTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

/**
 * A free AI provider. `streamChat` yields text deltas. Throwing BEFORE the first
 * yield (auth/quota/network) lets the runner fall through to the next provider
 * cleanly; throwing mid-stream ends that response (rare, accepted).
 */
export interface ChatProvider {
  readonly id: string;
  isConfigured(): boolean;
  streamChat(opts: ChatStreamOptions): AsyncIterable<string>;
}
