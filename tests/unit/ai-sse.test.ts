import { describe, it, expect } from "vitest";
import { iterateSSE } from "@/lib/ai/sse";

function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const out: string[] = [];
  for await (const payload of iterateSSE(stream)) out.push(payload);
  return out;
}

describe("iterateSSE", () => {
  it("yields each `data:` payload", async () => {
    const out = await collect(streamFrom(["data: a\n\n", "data: b\n\n"]));
    expect(out).toEqual(["a", "b"]);
  });

  it("reassembles a payload split across network chunks", async () => {
    const out = await collect(streamFrom(['data: {"x":', '1}\n\n']));
    expect(out).toEqual(['{"x":1}']);
  });

  it("ignores non-data lines and passes through the [DONE] sentinel", async () => {
    const out = await collect(streamFrom([": comment\n", "event: ping\n", "data: hello\n\n", "data: [DONE]\n\n"]));
    expect(out).toEqual(["hello", "[DONE]"]);
  });
});
