import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchema } from "@/content/schemas";
import { getRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXED_REPLY = "Chat is coming soon — reach me via Calendly for now.";

function err(code: string, message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  let limit;
  try {
    limit = await getRateLimit().limit(ip);
  } catch {
    return err("SERVICE_UNAVAILABLE", "Rate limiter unreachable", 503);
  }
  if (!limit.success) {
    return err("RATE_LIMITED", "Too many requests", 429, { "Retry-After": "60" });
  }

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 4096) return err("PAYLOAD_TOO_LARGE", "Body too large", 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("BAD_REQUEST", "Invalid JSON", 400);
  }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return err("BAD_REQUEST", "Schema validation failed", 400);

  return NextResponse.json({ reply: FIXED_REPLY });
}

export async function GET() {
  return err("METHOD_NOT_ALLOWED", "POST only", 405, { Allow: "POST" });
}
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
