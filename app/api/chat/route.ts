import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchemaV2 } from "@/content/schemas";
import { getRateLimit } from "@/lib/rate-limit";
import { getChatConfig } from "@/lib/ai/config";
import { allowDailyUsage } from "@/lib/chat/usage";
import { runChatWithFallback } from "@/lib/chat/run-chat";
import { STATIC_FALLBACK_REPLY } from "@/lib/ai/providers/static";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Multi-turn payloads are larger than the old single-message body.
const MAX_BODY_BYTES = 16384;

function err(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

function staticReply() {
  return new Response(STATIC_FALLBACK_REPLY, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-chat-provider": "static",
    },
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  // 1. Per-IP rate limit (burst protection). Fails OPEN — a limiter outage must
  //    not take the chat down (mirrors allowDailyUsage in lib/chat/usage.ts).
  //    The kill-switch + daily cap + free-tier providers still bound abuse.
  //    Logged so a real outage is diagnosable instead of silently degrading.
  let limit;
  try {
    limit = await getRateLimit().limit(ip);
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[chat] rate limiter unreachable — failing open:",
        e instanceof Error ? e.message : e,
      );
    }
    limit = { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  if (!limit.success) {
    return err("RATE_LIMITED", "Too many requests", 429, { "Retry-After": "60" });
  }

  // 2. Body-size cap. The content-length header is a fast early-out, but it is
  //    client-controlled (absent on chunked requests), so the actual byte length
  //    is the authoritative check.
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return err("PAYLOAD_TOO_LARGE", "Body too large", 413);

  let raw: ArrayBuffer;
  try {
    raw = await req.arrayBuffer();
  } catch {
    return err("BAD_REQUEST", "Invalid body", 400);
  }
  if (raw.byteLength > MAX_BODY_BYTES) return err("PAYLOAD_TOO_LARGE", "Body too large", 413);

  // 3. Parse + strict-validate the multi-turn body.
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return err("BAD_REQUEST", "Invalid JSON", 400);
  }
  const parsed = ChatRequestSchemaV2.safeParse(body);
  if (!parsed.success) return err("BAD_REQUEST", "Schema validation failed", 400);

  // 4. Kill-switch + daily cost ceiling — degrade to the static reply, never error.
  if (!getChatConfig().enabled) return staticReply();
  if (!(await allowDailyUsage())) return staticReply();

  // 5. Stream the grounded answer through the provider fallback chain.
  return runChatWithFallback({ messages: parsed.data.messages, signal: req.signal });
}

export async function GET() {
  return err("METHOD_NOT_ALLOWED", "POST only", 405, { Allow: "POST" });
}
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
