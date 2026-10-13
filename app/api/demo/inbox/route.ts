import { NextRequest, NextResponse } from "next/server";
import { InboxDemoRequestSchema } from "@/content/schemas";
import { getRateLimit } from "@/lib/rate-limit";
import { getChatConfig } from "@/lib/ai/config";
import { getLiveProviderChain } from "@/lib/ai/registry";
import { allowDailyUsage } from "@/lib/chat/usage";
import { runInboxDemo } from "@/lib/demo/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// { "email": <up to 1500 chars> } plus JSON overhead fits well inside 4 KB.
const MAX_BODY_BYTES = 4096;

const NO_STORE = { "cache-control": "no-store" };

const OFFLINE_MESSAGE = "The live demo is offline right now. Please try again later.";
const CAPPED_MESSAGE = "The live demo has reached its limit for today. Please try again tomorrow.";

function err(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * POST /api/demo/inbox, the "Try it yourself" box on the CS Live Inbox page.
 * Body { email }. Returns { needsReply, reason, draft, provider }, or
 * 503 DEMO_OFFLINE when no live AI provider can answer.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  // 1. Per-IP rate limit, the same limiter as the chat. It falls back to memory
  //    by itself when Upstash is down; the catch is only a last resort.
  let limit;
  try {
    limit = await getRateLimit().limit(ip);
  } catch {
    limit = { success: true };
  }
  if (!limit.success) {
    return err("RATE_LIMITED", "Too many requests", 429, { "Retry-After": "60" });
  }

  // 2. Body-size cap: content-length is a fast early-out, the real byte length
  //    is the authoritative check (the header is client-controlled).
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return err("PAYLOAD_TOO_LARGE", "Body too large", 400);

  let raw: ArrayBuffer;
  try {
    raw = await req.arrayBuffer();
  } catch {
    return err("BAD_REQUEST", "Invalid body", 400);
  }
  if (raw.byteLength > MAX_BODY_BYTES) return err("PAYLOAD_TOO_LARGE", "Body too large", 400);

  // 3. Parse + strict-validate { email }.
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return err("BAD_REQUEST", "Invalid JSON", 400);
  }
  const parsed = InboxDemoRequestSchema.safeParse(body);
  if (!parsed.success) return err("BAD_REQUEST", "Schema validation failed", 400);

  // 4. Kill-switch, then "is there anyone to ask?" BEFORE spending a daily unit.
  const providers = getLiveProviderChain();
  if (!getChatConfig().enabled || providers.length === 0) {
    return err("DEMO_OFFLINE", OFFLINE_MESSAGE, 503);
  }
  if (!(await allowDailyUsage())) return err("DEMO_OFFLINE", CAPPED_MESSAGE, 503);

  // 5. Triage, then a draft if it needs a reply.
  const result = await runInboxDemo({ email: parsed.data.email, providers, signal: req.signal });
  if (!result) return err("DEMO_OFFLINE", OFFLINE_MESSAGE, 503);

  return NextResponse.json(result, { status: 200, headers: NO_STORE });
}

export async function GET() {
  return err("METHOD_NOT_ALLOWED", "POST only", 405, { Allow: "POST" });
}
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
