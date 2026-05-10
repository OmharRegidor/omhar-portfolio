import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/rate-limit");
});

function jsonReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/chat", () => {
  it("returns 200 + fixed reply on valid body", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "hi" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toMatch(/coming soon/i);
  });

  it("returns 400 on invalid body", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 on message > 1000 chars", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "a".repeat(1001) }));
    expect(res.status).toBe(400);
  });

  it("returns 429 on rate limit exceeded", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "hi" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("returns 413 when content-length > 4096", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "x" }, { "content-length": "9999" }));
    expect(res.status).toBe(413);
  });

  it("returns 400 on invalid JSON body", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq("{not-json"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 on extra fields (Zod .strict)", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "hi", evil: "x" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 when rate limiter throws", async () => {
    vi.doMock("@/lib/rate-limit", () => ({
      getRateLimit: () => ({
        limit: vi.fn().mockRejectedValue(new Error("upstash down")),
      }),
    }));
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(jsonReq({ message: "hi" }));
    expect(res.status).toBe(503);
  });

  it("returns 405 on GET", async () => {
    const { GET } = await import("@/app/api/chat/route");
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
