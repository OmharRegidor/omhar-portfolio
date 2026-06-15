import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geminiProvider } from "@/lib/ai/providers/gemini";
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
      : '{"error":{"code":429,"message":"quota exceeded"}}';
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
  process.env.GOOGLE_AI_API_KEY = "goog_test";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_AI_API_KEY;
});

describe("geminiProvider.streamChat", () => {
  it("assembles streamed text from candidate parts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
          'data: {"candidates":[{"content":{"parts":[{"text":" there"}]}}]}\n\n',
        ]),
      ),
    );
    expect(await collect(geminiProvider.streamChat(opts))).toBe("Hello there");
  });

  it("disables thinking (thinkingBudget 0) so the token budget is not eaten by reasoning", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(["data: {}\n\n"]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(geminiProvider.streamChat(opts));
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(body.generationConfig.maxOutputTokens).toBe(350);
  });

  it("maps assistant->model and keeps the system prompt as systemInstruction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(["data: {}\n\n"]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(
      geminiProvider.streamChat({
        ...opts,
        messages: [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
          { role: "user", content: "c" },
        ],
      }),
    );
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
    expect(body.systemInstruction.parts[0].text).toBe("SYSTEM_PROMPT");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-goog-api-key"]).toBe("goog_test");
  });

  it("throws before the first chunk on a non-OK response, surfacing the error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([], 429)));
    await expect(collect(geminiProvider.streamChat(opts))).rejects.toThrow(/429.*quota/);
  });
});
