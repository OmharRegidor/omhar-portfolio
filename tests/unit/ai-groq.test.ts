import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { groqProvider } from "@/lib/ai/providers/groq";
import type { ChatStreamOptions } from "@/lib/ai/types";

function sseResponse(lines: string[], status = 200): Response {
  const enc = new TextEncoder();
  const body =
    status === 200
      ? new ReadableStream<Uint8Array>({
          start(c) {
            for (const l of lines) c.enqueue(enc.encode(l));
            c.close();
          },
        })
      : '{"error":{"message":"bad key"}}';
  return new Response(body, { status });
}

const opts: ChatStreamOptions = {
  system: "SYSTEM_PROMPT",
  messages: [{ role: "user", content: "hi" }],
  maxOutputTokens: 350,
  temperature: 0.3,
};

async function collect(it: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const t of it) out += t;
  return out;
}

beforeEach(() => {
  process.env.GROQ_API_KEY = "gsk_test";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GROQ_API_KEY;
});

describe("groqProvider.streamChat", () => {
  it("concatenates streamed deltas and stops at [DONE]", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
          "data: [DONE]\n\n",
          'data: {"choices":[{"delta":{"content":"AFTER_DONE"}}]}\n\n',
        ]),
      ),
    );
    expect(await collect(groqProvider.streamChat(opts))).toBe("Hello world");
  });

  it("skips malformed JSON chunks without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse(["data: not-json\n\n", 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n']),
      ),
    );
    expect(await collect(groqProvider.streamChat(opts))).toBe("ok");
  });

  it("sends max_completion_tokens (not deprecated max_tokens) + a system message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(["data: [DONE]\n\n"]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(groqProvider.streamChat(opts));
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.max_completion_tokens).toBe(350);
    expect(body.max_tokens).toBeUndefined();
    expect(body.messages[0]).toEqual({ role: "system", content: "SYSTEM_PROMPT" });
    expect(body.stream).toBe(true);
  });

  it("throws before the first chunk on a non-OK response, surfacing the error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([], 401)));
    await expect(collect(groqProvider.streamChat(opts))).rejects.toThrow(/401.*bad key/);
  });
});
