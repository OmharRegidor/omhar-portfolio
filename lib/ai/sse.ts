/**
 * Iterate a Server-Sent-Events body, yielding the payload of each `data:` line.
 * Reassembles payloads that arrive split across network chunks. The `[DONE]`
 * sentinel is yielded as-is for the caller to handle.
 */
export async function* iterateSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (line.startsWith("data:")) yield line.slice(5).trim();
      }
    }
    const tail = buffer.trim();
    if (tail.startsWith("data:")) yield tail.slice(5).trim();
  } finally {
    reader.releaseLock();
  }
}
