/**
 * Chat/AI configuration is read DIRECTLY from process.env here (not via the Zod
 * EnvSchema in lib/env.ts) on purpose — same rationale as RATE_LIMIT_BYPASS in
 * lib/rate-limit.ts. getEnv() requires the Upstash credentials, but a local dev
 * running with RATE_LIMIT_BYPASS=1 may not have them; coupling the AI config to
 * getEnv() would break that path. All keys are server-only — never NEXT_PUBLIC_.
 */
export interface ChatConfig {
  groqApiKey: string;
  googleApiKey: string;
  providers: string[];
  enabled: boolean;
  dailyCap: number;
  timeoutMs: number;
  groqModel: string;
  geminiModel: string;
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getChatConfig(): ChatConfig {
  return {
    groqApiKey: process.env.GROQ_API_KEY?.trim() ?? "",
    googleApiKey: process.env.GOOGLE_AI_API_KEY?.trim() ?? "",
    providers: (process.env.AI_PROVIDERS ?? "groq,google")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    enabled: (process.env.CHAT_ENABLED ?? "1") !== "0",
    dailyCap: num(process.env.CHAT_DAILY_CAP, 500),
    timeoutMs: num(process.env.CHAT_PROVIDER_TIMEOUT_MS, 8000),
    groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
    geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  };
}
