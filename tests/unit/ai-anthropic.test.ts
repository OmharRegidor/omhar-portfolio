import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
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
      : '{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}';
  return new Response(body, { status });
}

/** One Anthropic SSE frame: an `event:` line plus its JSON `data:` line. */
function frame(type: string, data: Record<string, unknown> = {}): string {
  return `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
}

const textDelta = (text: string, index = 0) =>
  frame("content_block_delta", { index, delta: { type: "text_delta", text } });

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
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_MODEL;
});

describe("anthropicProvider", () => {
  it("is configured only when ANTHROPIC_API_KEY is set", () => {
    expect(anthropicProvider.isConfigured()).toBe(true);
    delete process.env.ANTHROPIC_API_KEY;
    expect(anthropicProvider.isConfigured()).toBe(false);
  });
});

describe("anthropicProvider.streamChat", () => {
  it("concatenates text deltas and stops at message_stop", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          frame("message_start", { message: { id: "msg_1", content: [] } }),
          frame("content_block_start", { index: 0, content_block: { type: "text", text: "" } }),
          frame("ping"),
          textDelta("Hello"),
          textDelta(" world"),
          frame("content_block_stop", { index: 0 }),
          frame("message_delta", { delta: { stop_reason: "end_turn" } }),
          frame("message_stop"),
          textDelta("AFTER_STOP"),
        ]),
      ),
    );
    expect(await collect(anthropicProvider.streamChat(opts))).toBe("Hello world");
  });

  it("yields only text_delta deltas (thinking and signature deltas are skipped)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([
          frame("content_block_delta", { index: 0, delta: { type: "thinking_delta", thinking: "hmm" } }),
          frame("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "sig" } }),
          textDelta("answer", 1),
          frame("message_stop"),
        ]),
      ),
    );
    expect(await collect(anthropicProvider.streamChat(opts))).toBe("answer");
  });

  it("skips malformed JSON chunks without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sseResponse(["data: not-json\n\n", textDelta("ok"), frame("message_stop")])),
    );
    expect(await collect(anthropicProvider.streamChat(opts))).toBe("ok");
  });

  it("sends the Messages API headers and a cached system block", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([frame("message_stop")]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(anthropicProvider.streamChat(opts));

    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-ant-test");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(headers["content-type"]).toBe("application/json");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("claude-haiku-5-5");
    expect(body.max_tokens).toBe(350);
    expect(body.stream).toBe(true);
    expect(body.system).toEqual([
      { type: "text", text: "SYSTEM_PROMPT", cache_control: { type: "ephemeral" } },
    ]);
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("omits temperature (current Claude models 400 on non-default sampling) and turns thinking off on Haiku", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([frame("message_stop")]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(anthropicProvider.streamChat(opts));
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).not.toHaveProperty("temperature");
    expect(body.thinking).toEqual({ type: "disabled" });
  });

  it("honors ANTHROPIC_MODEL and leaves thinking at the model default off Haiku", async () => {
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5-5";
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([frame("message_stop")]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(anthropicProvider.streamChat(opts));
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.model).toBe("claude-sonnet-5-5");
    expect(body).not.toHaveProperty("thinking");
  });

  it("keeps the user/assistant turn order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([frame("message_stop")]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(
      anthropicProvider.streamChat({
        ...opts,
        messages: [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
          { role: "user", content: "c" },
        ],
      }),
    );
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("throws before the first chunk on a non-OK response, surfacing the error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([], 401)));
    await expect(collect(anthropicProvider.streamChat(opts))).rejects.toThrow(/401.*invalid x-api-key/);
  });

  it("throws on an error event inside the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        sseResponse([frame("error", { error: { type: "overloaded_error", message: "Overloaded" } })]),
      ),
    );
    await expect(collect(anthropicProvider.streamChat(opts))).rejects.toThrow(/overloaded_error.*Overloaded/);
  });
});
